package com.sayline.englishstudy.admin;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import com.sayline.englishstudy.admin.AdminDtos.BookAdminView;
import com.sayline.englishstudy.admin.AdminDtos.BookRequest;
import com.sayline.englishstudy.admin.AdminDtos.CategoryAdminView;
import com.sayline.englishstudy.admin.AdminDtos.CategoryRequest;
import com.sayline.englishstudy.admin.AdminDtos.CourseAdminView;
import com.sayline.englishstudy.admin.AdminDtos.CourseRequest;
import com.sayline.englishstudy.admin.AdminDtos.DashboardView;
import com.sayline.englishstudy.admin.AdminDtos.UserAdminView;
import com.sayline.englishstudy.auth.AuthenticatedUser;
import com.sayline.englishstudy.auth.RefreshSessionRepository;
import com.sayline.englishstudy.catalog.Book;
import com.sayline.englishstudy.catalog.BookRepository;
import com.sayline.englishstudy.catalog.Course;
import com.sayline.englishstudy.catalog.CourseCategory;
import com.sayline.englishstudy.catalog.CourseCategoryRepository;
import com.sayline.englishstudy.catalog.CourseRepository;
import com.sayline.englishstudy.catalog.CourseStatus;
import com.sayline.englishstudy.catalog.ParsedSubtitleCue;
import com.sayline.englishstudy.catalog.SubtitleCue;
import com.sayline.englishstudy.catalog.SubtitleCueRepository;
import com.sayline.englishstudy.catalog.SubtitleParseException;
import com.sayline.englishstudy.catalog.SubtitleParser;
import com.sayline.englishstudy.common.ApiException;
import com.sayline.englishstudy.common.PageResponse;
import com.sayline.englishstudy.learning.DictationAttemptRepository;
import com.sayline.englishstudy.learning.LearningCueProgressRepository;
import com.sayline.englishstudy.learning.LearningDailyStatRepository;
import com.sayline.englishstudy.learning.LearningRecord;
import com.sayline.englishstudy.learning.LearningRecordRepository;
import com.sayline.englishstudy.learning.StudySessionRepository;
import com.sayline.englishstudy.storage.CoverImageService;
import com.sayline.englishstudy.storage.StorageService;
import com.sayline.englishstudy.user.User;
import com.sayline.englishstudy.user.UserRepository;
import com.sayline.englishstudy.user.UserRole;
import com.sayline.englishstudy.user.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Shanghai");

    private final CourseCategoryRepository categoryRepository;
    private final CourseRepository courseRepository;
    private final BookRepository bookRepository;
    private final SubtitleCueRepository cueRepository;
    private final SubtitleParser subtitleParser;
    private final CoverImageService coverImageService;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final RefreshSessionRepository refreshSessionRepository;
    private final LearningRecordRepository recordRepository;
    private final LearningCueProgressRepository cueProgressRepository;
    private final LearningDailyStatRepository dailyStatRepository;
    private final StudySessionRepository sessionRepository;
    private final DictationAttemptRepository dictationRepository;

    public AdminService(
        CourseCategoryRepository categoryRepository,
        CourseRepository courseRepository,
        BookRepository bookRepository,
        SubtitleCueRepository cueRepository,
        SubtitleParser subtitleParser,
        CoverImageService coverImageService,
        StorageService storageService,
        UserRepository userRepository,
        RefreshSessionRepository refreshSessionRepository,
        LearningRecordRepository recordRepository,
        LearningCueProgressRepository cueProgressRepository,
        LearningDailyStatRepository dailyStatRepository,
        StudySessionRepository sessionRepository,
        DictationAttemptRepository dictationRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.courseRepository = courseRepository;
        this.bookRepository = bookRepository;
        this.cueRepository = cueRepository;
        this.subtitleParser = subtitleParser;
        this.coverImageService = coverImageService;
        this.storageService = storageService;
        this.userRepository = userRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.recordRepository = recordRepository;
        this.cueProgressRepository = cueProgressRepository;
        this.dailyStatRepository = dailyStatRepository;
        this.sessionRepository = sessionRepository;
        this.dictationRepository = dictationRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<CategoryAdminView> categories(int page, int size) {
        PageRequest pageable = PageRequest.of(
            Math.max(0, page),
            Math.min(50, Math.max(1, size)),
            Sort.by("sortOrder", "name"));
        return PageResponse.from(categoryRepository.findAll(pageable).map(this::toView));
    }

    @Transactional
    public CategoryAdminView createCategory(CategoryRequest request) {
        CourseCategory category = new CourseCategory();
        apply(category, request);
        return toView(categoryRepository.save(category));
    }

    @Transactional
    public CategoryAdminView updateCategory(Long categoryId, CategoryRequest request) {
        CourseCategory category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> notFound("课程分类不存在"));
        apply(category, request);
        return toView(category);
    }

    @Transactional
    public void deleteCategory(Long categoryId) {
        if (bookRepository.existsByCategoryId(categoryId)) {
            throw new ApiException("CATEGORY_HAS_BOOKS", HttpStatus.CONFLICT, "该分类下仍有书籍，只能隐藏");
        }
        categoryRepository.deleteById(categoryId);
    }

    @Transactional(readOnly = true)
    public PageResponse<BookAdminView> books(Long categoryId, int page, int size) {
        PageRequest pageable = PageRequest.of(
            Math.max(0, page),
            Math.min(50, Math.max(1, size)),
            Sort.by("sortOrder", "id"));
        Page<Book> books = categoryId == null
            ? bookRepository.findAll(pageable)
            : bookRepository.findByCategoryId(categoryId, pageable);
        return PageResponse.from(books.map(this::toView));
    }

    @Transactional
    public BookAdminView createBook(BookRequest request) {
        Book book = new Book();
        apply(book, request);
        coverImageService.process(book);
        return toView(bookRepository.save(book));
    }

    @Transactional
    public BookAdminView updateBook(Long bookId, BookRequest request) {
        Book book = bookRepository.findById(bookId)
            .orElseThrow(() -> notFound("书籍不存在"));
        String previousCoverKey = book.getCoverObjectKey();
        apply(book, request);
        if (!equalsNullable(previousCoverKey, book.getCoverObjectKey())) {
            book.setCoverThumbnailObjectKey(null);
            book.setSpineColor(null);
            coverImageService.process(book);
        }
        return toView(book);
    }

    @Transactional
    public void deleteBook(Long bookId) {
        Book book = bookRepository.findById(bookId)
            .orElseThrow(() -> notFound("书籍不存在"));
        if (courseRepository.existsByBookId(bookId)) {
            throw new ApiException("BOOK_HAS_LESSONS", HttpStatus.CONFLICT, "该书下仍有课时，只能隐藏");
        }
        bookRepository.delete(book);
    }

    @Transactional(readOnly = true)
    public PageResponse<CourseAdminView> courses(
        Long bookId,
        CourseStatus status,
        String query,
        int page,
        int size
    ) {
        String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
        PageRequest pageable = PageRequest.of(
            Math.max(0, page),
            Math.min(50, Math.max(1, size)),
            Sort.by(
                Sort.Order.asc("book.sortOrder"),
                Sort.Order.asc("sortOrder"),
                Sort.Order.asc("id")));
        return PageResponse.from(courseRepository.searchAdmin(bookId, status, normalizedQuery, pageable)
            .map(this::toView));
    }

    @Transactional(readOnly = true)
    public CourseAdminView course(Long courseId) {
        return toView(requiredCourse(courseId));
    }

    @Transactional
    public CourseAdminView createCourse(AuthenticatedUser admin, CourseRequest request) {
        Course course = new Course();
        course.setCreatedBy(userRepository.getReferenceById(admin.id()));
        course.setStatus(CourseStatus.DRAFT);
        apply(course, request, false);
        course = courseRepository.save(course);
        replaceCues(course, request.subtitleObjectKey());
        return toView(course);
    }

    @Transactional
    public CourseAdminView updateCourse(Long courseId, CourseRequest request) {
        Course course = requiredCourse(courseId);
        boolean subtitleChanged = !equalsNullable(course.getSubtitleObjectKey(), request.subtitleObjectKey());
        boolean audioChanged = !equalsNullable(course.getAudioObjectKey(), request.audioObjectKey());
        List<LearningRecord> records = recordRepository.findByCourseId(courseId);
        if ((subtitleChanged || audioChanged) && !records.isEmpty() && !request.resetLearning()) {
            throw new ApiException(
                "LEARNING_RESET_REQUIRED",
                HttpStatus.CONFLICT,
                "替换音频或字幕后需要确认重置学习进度");
        }
        if ((subtitleChanged || audioChanged) && request.resetLearning()) {
            resetLearning(courseId, records);
        }
        apply(course, request, false);
        if (subtitleChanged) {
            replaceCues(course, request.subtitleObjectKey());
        }
        return toView(course);
    }

    @Transactional
    public CourseAdminView publish(Long courseId) {
        Course course = requiredCourse(courseId);
        if (isBlank(course.getBook().getCoverObjectKey()) || isBlank(course.getAudioObjectKey())
            || isBlank(course.getSubtitleObjectKey())) {
            throw new ApiException("MEDIA_REQUIRED", HttpStatus.CONFLICT, "书籍封面、音频和字幕必须全部上传");
        }
        if (cueRepository.countByCourseId(courseId) == 0) {
            replaceCues(course, course.getSubtitleObjectKey());
        }
        course.setStatus(CourseStatus.PUBLISHED);
        course.setPublishedAt(Instant.now());
        return toView(course);
    }

    @Transactional
    public CourseAdminView offline(Long courseId) {
        Course course = requiredCourse(courseId);
        course.setStatus(CourseStatus.OFFLINE);
        return toView(course);
    }

    @Transactional
    public void deleteCourse(Long courseId) {
        Course course = requiredCourse(courseId);
        if (course.getStatus() == CourseStatus.PUBLISHED) {
            throw new ApiException("COURSE_PUBLISHED", HttpStatus.CONFLICT, "已发布课程需先下架才能删除");
        }
        courseRepository.delete(course);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserAdminView> users(String query, int page, int size) {
        String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
        return PageResponse.from(userRepository.search(
                normalizedQuery,
                PageRequest.of(Math.max(0, page), Math.min(50, Math.max(1, size)), Sort.by("createdAt").descending()))
            .map(this::toView));
    }

    @Transactional
    public UserAdminView updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> notFound("用户不存在"));
        user.setStatus(status);
        if (status == UserStatus.DISABLED) {
            refreshSessionRepository.revokeAllForUser(userId, Instant.now());
        }
        return toView(user);
    }

    @Transactional(readOnly = true)
    public DashboardView dashboard() {
        long learners = userRepository.countByRole(UserRole.USER);
        long completed = recordRepository.countByCompletedAtIsNotNull();
        long starts = recordRepository.count();
        long attempts = dictationRepository.count();
        long correct = dictationRepository.countByCorrectTrue();
        int dictationAccuracy = attempts == 0 ? 0 : (int) Math.round(correct * 100.0 / attempts);
        return new DashboardView(
            learners,
            sessionRepository.countActiveUsersSince(
                LocalDate.now(APP_ZONE).atStartOfDay(APP_ZONE).toInstant()),
            courseRepository.countByStatus(CourseStatus.PUBLISHED),
            starts,
            completed,
            starts == 0 ? 0 : (int) Math.round(completed * 100.0 / starts),
            dailyStatRepository.totalStudyMs(),
            dictationAccuracy,
            cueProgressRepository.countBySpokenTrue());
    }

    private void apply(CourseCategory category, CategoryRequest request) {
        category.setName(request.name().trim());
        category.setDescription(request.description());
        category.setCoverObjectKey(request.coverObjectKey());
        category.setThemeColorPrimary(request.themeColorPrimary());
        category.setThemeColorSecondary(request.themeColorSecondary());
        category.setSortOrder(request.sortOrder());
        category.setVisible(request.visible());
    }

    private void apply(Book book, BookRequest request) {
        CourseCategory category = categoryRepository.findById(request.categoryId())
            .orElseThrow(() -> notFound("课程分类不存在"));
        book.setCategory(category);
        book.setTitle(request.title().trim());
        book.setDescription(request.description());
        book.setCoverObjectKey(request.coverObjectKey());
        book.setThemeColorPrimary(request.themeColorPrimary());
        book.setThemeColorSecondary(request.themeColorSecondary());
        book.setSortOrder(request.sortOrder());
        book.setVisible(request.visible());
    }

    private void apply(Course course, CourseRequest request, boolean reset) {
        Book book = bookRepository.findById(request.bookId())
            .orElseThrow(() -> notFound("书籍不存在"));
        course.setBook(book);
        course.setCategory(book.getCategory());
        course.setTitle(request.title().trim());
        course.setDescription(request.description());
        course.setCoverObjectKey(request.coverObjectKey());
        course.setAudioObjectKey(request.audioObjectKey());
        course.setSubtitleObjectKey(request.subtitleObjectKey());
        course.setThemeColorPrimary(request.themeColorPrimary());
        course.setThemeColorSecondary(request.themeColorSecondary());
        course.setDurationMs(request.durationMs());
        course.setSortOrder(request.sortOrder());
    }

    private void replaceCues(Course course, String subtitleObjectKey) {
        if (isBlank(subtitleObjectKey)) {
            return;
        }
        try {
            List<ParsedSubtitleCue> parsed = subtitleParser.parse(
                storageService.readText(subtitleObjectKey), subtitleObjectKey);
            cueRepository.deleteByCourseId(course.getId());
            for (ParsedSubtitleCue item : parsed) {
                SubtitleCue cue = new SubtitleCue();
                cue.setCourse(course);
                cue.setSequenceNo(item.sequenceNo());
                cue.setStartMs(item.startMs());
                cue.setEndMs(item.endMs());
                cue.setEnglishText(item.englishText());
                cue.setChineseText(item.chineseText());
                cueRepository.save(cue);
            }
        } catch (SubtitleParseException exception) {
            throw new ApiException("SUBTITLE_INVALID", HttpStatus.UNPROCESSABLE_ENTITY, exception.getMessage());
        }
    }

    private void resetLearning(Long courseId, List<LearningRecord> records) {
        cueProgressRepository.deleteByCourseId(courseId);
        for (LearningRecord record : records) {
            record.setLastCue(null);
            record.setLastPositionMs(0);
            record.setListenProgress(0);
            record.setReadProgress(0);
            record.setWriteProgress(0);
            record.setSpeakProgress(0);
            record.setListenConfirmed(false);
            record.setReadConfirmed(false);
            record.setWriteConfirmed(false);
            record.setSpeakConfirmed(false);
            record.setCompletedAt(null);
        }
    }

    private Course requiredCourse(Long courseId) {
        return courseRepository.findById(courseId)
            .orElseThrow(() -> notFound("课程不存在"));
    }

    private CategoryAdminView toView(CourseCategory category) {
        return new CategoryAdminView(
            category.getId(),
            category.getName(),
            category.getDescription(),
            category.getCoverObjectKey(),
            coverUrl(category.getCoverObjectKey()),
            category.getThemeColorPrimary(),
            category.getThemeColorSecondary(),
            category.getSortOrder(),
            category.isVisible());
    }

    private String coverUrl(String objectKey) {
        return isBlank(objectKey) ? null : storageService.presignDownload(objectKey);
    }

    private BookAdminView toView(Book book) {
        return new BookAdminView(
            book.getId(),
            book.getCategory().getId(),
            book.getCategory().getName(),
            book.getTitle(),
            book.getDescription(),
            book.getCoverObjectKey(),
            coverUrl(book.getCoverObjectKey()),
            book.getThemeColorPrimary(),
            book.getThemeColorSecondary(),
            book.getSortOrder(),
            book.isVisible());
    }

    private CourseAdminView toView(Course course) {
        return new CourseAdminView(
            course.getId(),
            course.getBook().getId(),
            course.getBook().getTitle(),
            course.getCategory().getId(),
            course.getCategory().getName(),
            course.getTitle(),
            course.getDescription(),
            course.getCoverObjectKey(),
            course.getAudioObjectKey(),
            course.getSubtitleObjectKey(),
            course.getThemeColorPrimary(),
            course.getThemeColorSecondary(),
            course.getDurationMs(),
            course.getSortOrder(),
            course.getStatus(),
            course.getPublishedAt());
    }

    private UserAdminView toView(User user) {
        return new UserAdminView(
            user.getId(),
            user.getPhone(),
            user.getNickname(),
            user.getRole(),
            user.getStatus(),
            user.getCreatedAt(),
            user.getLastLoginAt());
    }

    private ApiException notFound(String message) {
        return new ApiException("NOT_FOUND", HttpStatus.NOT_FOUND, message);
    }

    private boolean equalsNullable(String left, String right) {
        return left == null ? right == null : left.equals(right);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
