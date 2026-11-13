package com.sayline.englishstudy.admin;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sayline.englishstudy.admin.AdminDtos.CourseAdminView;
import com.sayline.englishstudy.admin.AdminDtos.CourseRequest;
import com.sayline.englishstudy.admin.ImportDtos.ImportExecuteRequest;
import com.sayline.englishstudy.admin.ImportDtos.ImportItemRequest;
import com.sayline.englishstudy.admin.ImportDtos.ImportItemView;
import com.sayline.englishstudy.admin.ImportDtos.ImportJobView;
import com.sayline.englishstudy.admin.ImportDtos.ImportPreviewRequest;
import com.sayline.englishstudy.admin.ImportDtos.ImportPreviewView;
import com.sayline.englishstudy.auth.AuthenticatedUser;
import com.sayline.englishstudy.catalog.Book;
import com.sayline.englishstudy.catalog.BookRepository;
import com.sayline.englishstudy.catalog.Course;
import com.sayline.englishstudy.catalog.CourseRepository;
import com.sayline.englishstudy.catalog.CourseStatus;
import com.sayline.englishstudy.common.ApiException;
import com.sayline.englishstudy.common.PageResponse;
import com.sayline.englishstudy.storage.StorageService;
import com.sayline.englishstudy.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AdminImportService {

    private static final TypeReference<List<ImportItemView>> ITEM_LIST = new TypeReference<>() {
    };

    private final CourseRepository courseRepository;
    private final BookRepository bookRepository;
    private final ContentImportJobRepository jobRepository;
    private final StorageService storageService;
    private final AdminService adminService;
    private final UserRepository userRepository;
    private final AdminAuditService auditService;
    private final ObjectMapper objectMapper;
    private final Map<String, String> md5Cache = new ConcurrentHashMap<>();

    public AdminImportService(
        CourseRepository courseRepository,
        BookRepository bookRepository,
        ContentImportJobRepository jobRepository,
        StorageService storageService,
        AdminService adminService,
        UserRepository userRepository,
        AdminAuditService auditService,
        ObjectMapper objectMapper
    ) {
        this.courseRepository = courseRepository;
        this.bookRepository = bookRepository;
        this.jobRepository = jobRepository;
        this.storageService = storageService;
        this.adminService = adminService;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    public ImportPreviewView preview(ImportPreviewRequest request) {
        List<Course> courses = courseRepository.findAllForImport();
        List<ImportItemView> items = request.type() == ImportType.SUBTITLE
            ? previewSubtitles(request, courses)
            : previewCreate(request, courses);
        int ready = (int) items.stream().filter(item -> item.status() == ImportItemStatus.READY).count();
        int invalid = (int) items.stream().filter(item -> item.status() == ImportItemStatus.INVALID).count();
        return new ImportPreviewView(
            items.size(),
            ready,
            items.size() - ready - invalid,
            invalid,
            items);
    }

    public ImportJobView execute(AuthenticatedUser admin, ImportExecuteRequest request) {
        ImportType type = request.type() == null ? ImportType.CREATE : request.type();
        ImportPreviewView preview = preview(new ImportPreviewRequest(type, request.bookId(), request.items()));
        List<ImportItemView> results = new ArrayList<>();
        Book book = request.bookId() == null
            ? null
            : bookRepository.findById(request.bookId())
                .orElseThrow(() -> new ApiException("BOOK_NOT_FOUND", HttpStatus.NOT_FOUND, "书籍不存在"));

        for (int index = 0; index < request.items().size(); index++) {
            ImportItemRequest item = request.items().get(index);
            ImportItemView planned = preview.items().get(index);
            if (planned.status() != ImportItemStatus.READY) {
                results.add(planned);
                continue;
            }
            try {
                CourseAdminView result = type == ImportType.SUBTITLE
                    ? updateSubtitle(item, planned.courseId(), request.resetLearning())
                    : createLesson(admin, book, item);
                results.add(new ImportItemView(
                    index,
                    item.sourceName(),
                    item.title(),
                    type == ImportType.SUBTITLE ? ImportItemStatus.UPDATED : ImportItemStatus.CREATED,
                    null,
                    result.id(),
                    result.title(),
                    result.bookName(),
                    planned.previousSubtitleObjectKey(),
                    null));
            } catch (RuntimeException exception) {
                results.add(new ImportItemView(
                    index,
                    item.sourceName(),
                    item.title(),
                    ImportItemStatus.FAILED,
                    null,
                    planned.courseId(),
                    planned.courseTitle(),
                    planned.bookTitle(),
                    planned.previousSubtitleObjectKey(),
                    exception.getMessage()));
            }
        }

        int success = (int) results.stream()
            .filter(item -> item.status() == ImportItemStatus.CREATED || item.status() == ImportItemStatus.UPDATED)
            .count();
        int failed = (int) results.stream().filter(item -> item.status() == ImportItemStatus.FAILED).count();
        int skipped = results.size() - success - failed;
        ImportStatus status = failed == 0
            ? ImportStatus.COMPLETED
            : success == 0 ? ImportStatus.FAILED : ImportStatus.PARTIAL;

        ContentImportJob job = new ContentImportJob();
        job.setType(type);
        job.setStatus(status);
        job.setBook(book);
        job.setCreatedBy(admin == null ? null : userRepository.getReferenceById(admin.id()));
        job.setTotalCount(results.size());
        job.setSuccessCount(success);
        job.setSkippedCount(skipped);
        job.setFailedCount(failed);
        job.setReportJson(writeItems(results));
        jobRepository.save(job);
        auditService.log(
            admin,
            type == ImportType.SUBTITLE ? "BATCH_SUBTITLE_UPDATE" : "BATCH_CONTENT_IMPORT",
            "CONTENT_IMPORT_JOB",
            job.getId(),
            "success=" + success + ", skipped=" + skipped + ", failed=" + failed);
        return toView(job);
    }

    public PageResponse<ImportJobView> jobs(int page, int size) {
        return PageResponse.from(jobRepository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(Math.max(0, page), Math.min(50, Math.max(1, size))))
            .map(this::toView));
    }

    public ImportJobView rollback(AuthenticatedUser admin, Long jobId) {
        ContentImportJob job = jobRepository.findById(jobId)
            .orElseThrow(() -> new ApiException("IMPORT_JOB_NOT_FOUND", HttpStatus.NOT_FOUND, "导入任务不存在"));
        if (job.getStatus() == ImportStatus.ROLLED_BACK) {
            return toView(job);
        }
        List<ImportItemView> items = readItems(job.getReportJson());
        for (ImportItemView item : items) {
            if (item.courseId() == null) {
                continue;
            }
            if (job.getType() == ImportType.CREATE) {
                CourseAdminView course = adminService.course(item.courseId());
                if (course.status() == CourseStatus.PUBLISHED) {
                    adminService.offline(course.id());
                }
                adminService.deleteCourse(course.id());
            } else if (item.previousSubtitleObjectKey() != null) {
                CourseAdminView course = adminService.course(item.courseId());
                adminService.updateCourse(course.id(), requestFor(course, item.previousSubtitleObjectKey(), true));
            }
        }
        job.setStatus(ImportStatus.ROLLED_BACK);
        jobRepository.save(job);
        auditService.log(admin, "ROLLBACK_IMPORT", "CONTENT_IMPORT_JOB", jobId, "items=" + items.size());
        return toView(job);
    }

    private List<ImportItemView> previewCreate(ImportPreviewRequest request, List<Course> courses) {
        if (request.bookId() == null) {
            throw new ApiException("BOOK_REQUIRED", HttpStatus.UNPROCESSABLE_ENTITY, "请选择目标书籍");
        }
        Book book = bookRepository.findById(request.bookId())
            .orElseThrow(() -> new ApiException("BOOK_NOT_FOUND", HttpStatus.NOT_FOUND, "书籍不存在"));
        Map<String, Course> audioOwners = audioOwners(courses);
        Set<String> titles = new HashSet<>();
        Set<String> batchMd5 = new HashSet<>();
        List<ImportItemView> results = new ArrayList<>();
        for (int index = 0; index < request.items().size(); index++) {
            int itemIndex = index;
            ImportItemRequest item = request.items().get(index);
            String title = normalizeTitle(item.title());
            String md5 = normalizeMd5(item.audioMd5());
            ImportItemView duplicateTitle = courses.stream()
                .filter(course -> course.getBook().getId().equals(book.getId()))
                .filter(course -> normalizeTitle(course.getTitle()).equalsIgnoreCase(title))
                .findFirst()
                .map(course -> result(itemIndex, item, ImportItemStatus.DUPLICATE, "目标书籍已有同名课时", course))
                .orElse(null);
            ImportItemView result = duplicateTitle;
            if (result == null && md5 == null) {
                result = result(index, item, ImportItemStatus.INVALID, "音频 MD5 无效", null);
            }
            if (result == null && audioOwners.containsKey(md5)) {
                result = result(index, item, ImportItemStatus.DUPLICATE, "音频已存在于其他课时", audioOwners.get(md5));
            }
            if (result == null && batchMd5.contains(md5)) {
                result = result(index, item, ImportItemStatus.DUPLICATE, "本批次内音频重复", null);
            }
            if (result == null && titles.contains(title.toLowerCase(Locale.ROOT))) {
                result = result(index, item, ImportItemStatus.DUPLICATE, "本批次内课时名重复", null);
            }
            if (result == null) {
                result = result(index, item, ImportItemStatus.READY, null, null);
                titles.add(title.toLowerCase(Locale.ROOT));
                batchMd5.add(md5);
            }
            results.add(result);
        }
        return results;
    }

    private List<ImportItemView> previewSubtitles(ImportPreviewRequest request, List<Course> courses) {
        Map<String, Course> audioOwners = audioOwners(courses);
        List<ImportItemView> results = new ArrayList<>();
        for (int index = 0; index < request.items().size(); index++) {
            ImportItemRequest item = request.items().get(index);
            Course course = item.courseId() == null
                ? audioOwners.get(normalizeMd5(item.audioMd5()))
                : courses.stream().filter(value -> value.getId().equals(item.courseId())).findFirst().orElse(null);
            if (course == null) {
                results.add(result(index, item, ImportItemStatus.INVALID, "没有找到对应课时", null));
                continue;
            }
            String previousMd5 = safeMd5(course.getSubtitleObjectKey());
            String localMd5 = normalizeMd5(item.subtitleMd5());
            ImportItemStatus status = previousMd5 != null && previousMd5.equals(localMd5)
                ? ImportItemStatus.UNCHANGED
                : ImportItemStatus.READY;
            results.add(new ImportItemView(
                index,
                item.sourceName(),
                item.title(),
                status,
                status == ImportItemStatus.UNCHANGED ? "字幕内容没有变化" : null,
                course.getId(),
                course.getTitle(),
                course.getBook().getTitle(),
                course.getSubtitleObjectKey(),
                null));
        }
        return results;
    }

    private CourseAdminView createLesson(AuthenticatedUser admin, Book book, ImportItemRequest item) {
        if (book == null || item.audioObjectKey() == null || item.subtitleObjectKey() == null) {
            throw new ApiException("IMPORT_MEDIA_REQUIRED", HttpStatus.UNPROCESSABLE_ENTITY, "音频和字幕必须先上传");
        }
        CourseRequest request = new CourseRequest(
            book.getId(),
            item.title().trim(),
            book.getTitle() + " · 批量导入",
            book.getCoverObjectKey(),
            item.audioObjectKey(),
            item.subtitleObjectKey(),
            book.getThemeColorPrimary(),
            book.getThemeColorSecondary(),
            item.durationMs(),
            parseSortOrder(item.title()),
            false);
        CourseAdminView created = adminService.createCourse(admin, request);
        return adminService.publish(created.id());
    }

    private CourseAdminView updateSubtitle(
        ImportItemRequest item,
        Long matchedCourseId,
        boolean resetLearning
    ) {
        Long courseId = item.courseId() == null ? matchedCourseId : item.courseId();
        if (courseId == null || item.subtitleObjectKey() == null) {
            throw new ApiException("IMPORT_MEDIA_REQUIRED", HttpStatus.UNPROCESSABLE_ENTITY, "字幕必须先上传并匹配课时");
        }
        CourseAdminView course = adminService.course(courseId);
        return adminService.updateCourse(course.id(), requestFor(course, item.subtitleObjectKey(), resetLearning));
    }

    private CourseRequest requestFor(CourseAdminView course, String subtitleObjectKey, boolean resetLearning) {
        return new CourseRequest(
            course.bookId(),
            course.title(),
            course.description(),
            course.coverObjectKey(),
            course.audioObjectKey(),
            subtitleObjectKey,
            course.themeColorPrimary(),
            course.themeColorSecondary(),
            course.durationMs(),
            course.sortOrder(),
            resetLearning);
    }

    private Map<String, Course> audioOwners(List<Course> courses) {
        Map<String, Course> owners = new HashMap<>();
        for (Course course : courses) {
            String md5 = safeAudioMd5(course.getAudioObjectKey());
            if (md5 != null) {
                owners.putIfAbsent(md5, course);
            }
        }
        return owners;
    }

    private String safeAudioMd5(String objectKey) {
        if (objectKey == null || objectKey.isBlank() || objectKey.startsWith("/")) {
            return null;
        }
        return md5Cache.computeIfAbsent(objectKey, key -> {
            try {
                return storageService.objectMd5(key);
            } catch (RuntimeException exception) {
                return null;
            }
        });
    }

    private String safeMd5(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }
        return safeAudioMd5(objectKey);
    }

    private ImportItemView result(
        int index,
        ImportItemRequest item,
        ImportItemStatus status,
        String reason,
        Course course
    ) {
        return new ImportItemView(
            index,
            item.sourceName(),
            item.title(),
            status,
            reason,
            course == null ? null : course.getId(),
            course == null ? null : course.getTitle(),
            course == null ? null : course.getBook().getTitle(),
            course == null ? null : course.getSubtitleObjectKey(),
            null);
    }

    private ImportJobView toView(ContentImportJob job) {
        return new ImportJobView(
            job.getId(),
            job.getType(),
            job.getStatus(),
            job.getBook() == null ? null : job.getBook().getId(),
            job.getTotalCount(),
            job.getSuccessCount(),
            job.getSkippedCount(),
            job.getFailedCount(),
            job.getCreatedAt(),
            job.getUpdatedAt(),
            readItems(job.getReportJson()));
    }

    private String writeItems(List<ImportItemView> items) {
        try {
            return objectMapper.writeValueAsString(items);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("无法保存导入报告", exception);
        }
    }

    private List<ImportItemView> readItems(String json) {
        try {
            return objectMapper.readValue(json, ITEM_LIST);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("无法读取导入报告", exception);
        }
    }

    private String normalizeTitle(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeMd5(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.matches("[0-9a-f]{32}") ? normalized : null;
    }

    private int parseSortOrder(String title) {
        String digits = title.replaceFirst("^(\\d+).*$", "$1");
        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException exception) {
            return 0;
        }
    }
}
