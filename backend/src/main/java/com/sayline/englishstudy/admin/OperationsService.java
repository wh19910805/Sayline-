package com.sayline.englishstudy.admin;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.sayline.englishstudy.admin.OperationsDtos.AuditLogView;
import com.sayline.englishstudy.admin.OperationsDtos.ContentHealthView;
import com.sayline.englishstudy.admin.OperationsDtos.FailedImportView;
import com.sayline.englishstudy.admin.OperationsDtos.HealthIssue;
import com.sayline.englishstudy.catalog.BookRepository;
import com.sayline.englishstudy.catalog.Course;
import com.sayline.englishstudy.catalog.CourseCategoryRepository;
import com.sayline.englishstudy.catalog.CourseRepository;
import com.sayline.englishstudy.catalog.CourseStatus;
import com.sayline.englishstudy.catalog.SubtitleCueRepository;
import com.sayline.englishstudy.storage.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OperationsService {

    private final CourseRepository courseRepository;
    private final SubtitleCueRepository cueRepository;
    private final BookRepository bookRepository;
    private final CourseCategoryRepository categoryRepository;
    private final StorageService storageService;
    private final ContentImportJobRepository importJobRepository;
    private final AdminAuditLogRepository auditLogRepository;

    public OperationsService(
        CourseRepository courseRepository,
        SubtitleCueRepository cueRepository,
        BookRepository bookRepository,
        CourseCategoryRepository categoryRepository,
        StorageService storageService,
        ContentImportJobRepository importJobRepository,
        AdminAuditLogRepository auditLogRepository
    ) {
        this.courseRepository = courseRepository;
        this.cueRepository = cueRepository;
        this.bookRepository = bookRepository;
        this.categoryRepository = categoryRepository;
        this.storageService = storageService;
        this.importJobRepository = importJobRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public ContentHealthView contentHealth() {
        List<Course> courses = courseRepository.findAllForImport();
        List<Long> courseIds = courses.stream().map(Course::getId).toList();
        Map<Long, Long> cueCounts = new HashMap<>();
        if (!courseIds.isEmpty()) {
            for (Object[] row : cueRepository.countByCourseIds(courseIds)) {
                cueCounts.put((Long) row[0], ((Number) row[1]).longValue());
            }
        }
        List<HealthIssue> issues = new ArrayList<>();
        int missingMedia = 0;
        int missingSubtitles = 0;
        Map<String, List<Course>> byAudioMd5 = new HashMap<>();
        Set<String> referencedKeys = new HashSet<>();
        categoryRepository.findAll().forEach(category -> {
            if (category.getCoverObjectKey() != null) referencedKeys.add(category.getCoverObjectKey());
        });
        bookRepository.findAll().forEach(book -> {
            addKey(referencedKeys, book.getCoverObjectKey());
            addKey(referencedKeys, book.getCoverThumbnailObjectKey());
        });
        for (Course course : courses) {
            addKey(referencedKeys, course.getCoverObjectKey());
            addKey(referencedKeys, course.getAudioObjectKey());
            addKey(referencedKeys, course.getSubtitleObjectKey());
            boolean incomplete = blanks(course.getCoverObjectKey(), course.getAudioObjectKey(), course.getSubtitleObjectKey());
            if (incomplete) {
                missingMedia += 1;
                issues.add(new HealthIssue("HIGH", "MISSING_MEDIA", "课时媒体不完整：" + course.getTitle(), course.getId()));
            }
            long cueCount = cueCounts.getOrDefault(course.getId(), 0L);
            if (cueCount == 0) {
                missingSubtitles += 1;
                issues.add(new HealthIssue("HIGH", "MISSING_SUBTITLE", "课时没有可用字幕：" + course.getTitle(), course.getId()));
            }
            String audioKey = course.getAudioObjectKey();
            if (audioKey != null && !audioKey.isBlank()) {
                try {
                    String md5 = storageService.objectMd5(audioKey);
                    if (md5 != null) {
                        byAudioMd5.computeIfAbsent(md5, key -> new ArrayList<>()).add(course);
                    }
                } catch (RuntimeException exception) {
                    issues.add(new HealthIssue("MEDIUM", "MEDIA_SCAN_FAILED", "无法读取音频校验值：" + course.getTitle(), course.getId()));
                }
            }
        }
        int duplicateGroups = 0;
        for (List<Course> group : byAudioMd5.values()) {
            if (group.size() > 1) {
                duplicateGroups += 1;
                issues.add(new HealthIssue(
                    "MEDIUM",
                    "DUPLICATE_AUDIO",
                    "发现重复音频：" + group.stream().map(Course::getTitle).limit(4).toList(),
                    group.getFirst().getId()));
            }
        }
        int orphanCount = 0;
        try {
            List<String> storedKeys = storageService.listObjectKeys("");
            orphanCount = (int) storedKeys.stream().filter(key -> !referencedKeys.contains(key)).count();
            if (orphanCount > 0) {
                issues.add(new HealthIssue("LOW", "ORPHAN_MEDIA", "对象存储中有 " + orphanCount + " 个未被课程引用的对象", null));
            }
        } catch (RuntimeException exception) {
            issues.add(new HealthIssue("MEDIUM", "STORAGE_SCAN_FAILED", "对象存储扫描失败，请检查存储服务", null));
        }
        List<FailedImportView> failedImports = importJobRepository
            .findTop20ByStatusInOrderByCreatedAtDesc(List.of(ImportStatus.FAILED, ImportStatus.PARTIAL))
            .stream()
            .map(job -> new FailedImportView(
                job.getId(), job.getType(), job.getStatus(), job.getFailedCount(), job.getCreatedAt()))
            .toList();
        List<AuditLogView> auditLogs = auditLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
            .map(log -> new AuditLogView(
                log.getId(),
                log.getActor() == null ? null : log.getActor().getId(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getDetail(),
                log.getCreatedAt()))
            .toList();
        return new ContentHealthView(
            (int) courses.stream().filter(course -> course.getStatus() == CourseStatus.PUBLISHED).count(),
            missingMedia,
            missingSubtitles,
            duplicateGroups,
            orphanCount,
            issues,
            failedImports,
            auditLogs);
    }

    private boolean blanks(String... values) {
        for (String value : values) {
            if (value == null || value.isBlank()) return true;
        }
        return false;
    }

    private void addKey(Set<String> keys, String value) {
        if (value != null && !value.isBlank()) keys.add(value);
    }
}
