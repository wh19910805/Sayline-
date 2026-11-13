package com.sayline.englishstudy.catalog;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.sayline.englishstudy.auth.AuthenticatedUser;
import com.sayline.englishstudy.catalog.CatalogDtos.BookDetail;
import com.sayline.englishstudy.catalog.CatalogDtos.BookSummary;
import com.sayline.englishstudy.catalog.CatalogDtos.CategoryView;
import com.sayline.englishstudy.catalog.CatalogDtos.CourseDetail;
import com.sayline.englishstudy.catalog.CatalogDtos.CourseSummary;
import com.sayline.englishstudy.catalog.CatalogDtos.CueSearchResult;
import com.sayline.englishstudy.catalog.CatalogDtos.CueView;
import com.sayline.englishstudy.catalog.CatalogDtos.RecentLesson;
import com.sayline.englishstudy.catalog.CatalogDtos.SearchResponse;
import com.sayline.englishstudy.common.ApiException;
import com.sayline.englishstudy.common.PageResponse;
import com.sayline.englishstudy.learning.BookFavorite;
import com.sayline.englishstudy.learning.BookFavoriteRepository;
import com.sayline.englishstudy.learning.CourseFavorite;
import com.sayline.englishstudy.learning.CourseFavoriteRepository;
import com.sayline.englishstudy.learning.LearningRecord;
import com.sayline.englishstudy.learning.LearningRecordRepository;
import com.sayline.englishstudy.storage.StorageService;
import com.sayline.englishstudy.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourseCatalogService {

    private final CourseCategoryRepository categoryRepository;
    private final CourseRepository courseRepository;
    private final SubtitleCueRepository cueRepository;
    private final CourseFavoriteRepository favoriteRepository;
    private final BookRepository bookRepository;
    private final BookFavoriteRepository bookFavoriteRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final LearningRecordRepository learningRecordRepository;

    public CourseCatalogService(
        CourseCategoryRepository categoryRepository,
        CourseRepository courseRepository,
        SubtitleCueRepository cueRepository,
        CourseFavoriteRepository favoriteRepository,
        BookRepository bookRepository,
        BookFavoriteRepository bookFavoriteRepository,
        UserRepository userRepository,
        StorageService storageService,
        LearningRecordRepository learningRecordRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.courseRepository = courseRepository;
        this.cueRepository = cueRepository;
        this.favoriteRepository = favoriteRepository;
        this.bookRepository = bookRepository;
        this.bookFavoriteRepository = bookFavoriteRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.learningRecordRepository = learningRecordRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryView> categories() {
        return categoryRepository.findByVisibleTrueOrderBySortOrderAscNameAsc().stream()
            .map(this::toCategoryView)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<BookSummary> books(Long userId, Long categoryId, String query) {
        String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
        List<Book> books = bookRepository.searchVisible(categoryId, normalizedQuery);
        return toBookSummaries(userId, books);
    }

    @Transactional(readOnly = true)
    public SearchResponse search(Long userId, String query) {
        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.isEmpty()) {
            return new SearchResponse(List.of(), List.of(), List.of());
        }
        List<Book> books = bookRepository.searchVisible(null, normalizedQuery)
            .stream()
            .limit(12)
            .toList();
        List<Course> lessons = courseRepository.searchPublished(
                null,
                normalizedQuery,
                CourseStatus.PUBLISHED,
                PageRequest.of(0, 12))
            .getContent();
        Set<Long> lessonFavorites = favoriteIds(userId, lessons);
        Map<Long, LearningRecord> records = recordsByCourse(userId, lessons);
        return new SearchResponse(
            toBookSummaries(userId, books),
            lessons.stream()
                .map(lesson -> toSummary(
                    lesson,
                    records.get(lesson.getId()),
                    lessonFavorites.contains(lesson.getId())))
                .toList(),
            cueRepository.searchPublished(normalizedQuery).stream()
                .limit(20)
                .map(cue -> new CueSearchResult(
                    cue.getId(),
                    cue.getCourse().getId(),
                    cue.getCourse().getBook().getId(),
                    cue.getCourse().getTitle(),
                    cue.getCourse().getBook().getTitle(),
                    cue.getSequenceNo(),
                    cue.getStartMs(),
                    cue.getEnglishText(),
                    cue.getChineseText()))
                .toList());
    }

    @Transactional(readOnly = true)
    public BookDetail book(Long userId, Long bookId) {
        Book book = bookRepository.findById(bookId)
            .filter(Book::isVisible)
            .orElseThrow(() -> new ApiException("BOOK_NOT_FOUND", HttpStatus.NOT_FOUND, "书籍不存在或已隐藏"));
        List<Course> lessons = courseRepository.findByBookIdAndStatusOrderBySortOrderAscIdAsc(
            bookId, CourseStatus.PUBLISHED);
        Map<Long, LearningRecord> records = recordsByCourse(userId, lessons);
        Set<Long> favoriteIds = favoriteIds(userId, lessons);
        List<CourseSummary> lessonViews = lessons.stream()
            .map(lesson -> toSummary(
                lesson,
                records.get(lesson.getId()),
                favoriteIds.contains(lesson.getId())))
            .toList();
        int lessonCount = lessons.size();
        Set<Long> completedIds = lessons.isEmpty()
            ? Set.of()
            : Set.copyOf(learningRecordRepository.findCompletedCourseIds(
                userId, lessons.stream().map(Course::getId).toList()));
        int bookProgress = lessonCount == 0
            ? 0
            : (int) Math.round(completedIds.size() * 100.0 / lessonCount);
        return new BookDetail(
            book.getId(),
            book.getTitle(),
            book.getDescription(),
            book.getCategory().getId(),
            book.getCategory().getName(),
            mediaUrl(book.getCoverObjectKey()),
            mediaUrl(book.getCoverThumbnailObjectKey()),
            book.getThemeColorPrimary(),
            book.getThemeColorSecondary(),
            book.getSpineColor(),
            lessonCount,
            bookProgress,
            bookFavoriteRepository.existsByUserIdAndBookId(userId, bookId),
            lessonViews);
    }

    @Transactional(readOnly = true)
    public List<BookSummary> favoriteBooks(Long userId) {
        Set<Long> ids = new LinkedHashSet<>(bookFavoriteRepository.findFavoriteBookIds(userId));
        ids.addAll(favoriteRepository.findFavoriteBookIdsViaLessons(userId));
        if (ids.isEmpty()) {
            return List.of();
        }
        List<Book> books = bookRepository.findAllById(ids).stream()
            .filter(Book::isVisible)
            .sorted(Comparator.comparingInt(Book::getSortOrder).thenComparing(Book::getId))
            .toList();
        return toBookSummaries(userId, books);
    }

    @Transactional(readOnly = true)
    public List<RecentLesson> recentLessons(Long userId) {
        return learningRecordRepository.findRecentByUserId(userId).stream()
            .map(this::toRecentLesson)
            .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<CourseSummary> courses(
        Long userId,
        Long categoryId,
        String query,
        int page,
        int size
    ) {
        String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
        Page<Course> courses = courseRepository.searchPublished(
            categoryId,
            normalizedQuery,
            CourseStatus.PUBLISHED,
            pageRequest(page, size));
        Set<Long> favoriteIds = favoriteIds(userId, courses.getContent());
        Map<Long, LearningRecord> records = recordsByCourse(userId, courses.getContent());
        return PageResponse.from(courses.map(course -> toSummary(
            course,
            records.get(course.getId()),
            favoriteIds.contains(course.getId()))));
    }

    @Transactional(readOnly = true)
    public PageResponse<CourseSummary> favorites(Long userId, int page, int size) {
        PageRequest pageRequest = pageRequest(page, size)
            .withSort(Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        Page<CourseFavorite> favorites = favoriteRepository.findPublishedFavorites(userId, pageRequest);
        Map<Long, LearningRecord> records = recordsByCourse(
            userId,
            favorites.getContent().stream().map(CourseFavorite::getCourse).toList());
        return PageResponse.from(favorites.map(favorite -> toSummary(
            favorite.getCourse(),
            records.get(favorite.getCourse().getId()),
            true)));
    }

    @Transactional(readOnly = true)
    public CourseDetail course(Long userId, Long courseId) {
        Course course = courseRepository.findByIdAndStatus(courseId, CourseStatus.PUBLISHED)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", HttpStatus.NOT_FOUND, "课程不存在或已下架"));
        List<CueView> cues = cueRepository.findByCourseIdOrderBySequenceNoAsc(courseId).stream()
            .map(this::toCueView)
            .toList();
        return new CourseDetail(
            course.getId(),
            course.getTitle(),
            course.getDescription(),
            course.getCategory().getId(),
            course.getCategory().getName(),
            mediaUrl(course.getCoverObjectKey()),
            mediaUrl(course.getAudioObjectKey()),
            course.getThemeColorPrimary(),
            course.getThemeColorSecondary(),
            course.getDurationMs(),
            favoriteRepository.existsByUserIdAndCourseId(userId, courseId),
            cues);
    }

    @Transactional
    public boolean addFavorite(AuthenticatedUser user, Long courseId) {
        courseRepository.findByIdAndStatus(courseId, CourseStatus.PUBLISHED)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", HttpStatus.NOT_FOUND, "课程不存在或已下架"));
        if (!favoriteRepository.existsByUserIdAndCourseId(user.id(), courseId)) {
            CourseFavorite favorite = new CourseFavorite();
            favorite.setUser(userRepository.getReferenceById(user.id()));
            favorite.setCourse(courseRepository.getReferenceById(courseId));
            favoriteRepository.save(favorite);
        }
        return true;
    }

    @Transactional
    public void removeFavorite(Long userId, Long courseId) {
        favoriteRepository.deleteByUserIdAndCourseId(userId, courseId);
    }

    @Transactional
    public boolean addFavoriteBook(AuthenticatedUser user, Long bookId) {
        bookRepository.findById(bookId)
            .filter(Book::isVisible)
            .orElseThrow(() -> new ApiException("BOOK_NOT_FOUND", HttpStatus.NOT_FOUND, "书籍不存在或已隐藏"));
        if (!bookFavoriteRepository.existsByUserIdAndBookId(user.id(), bookId)) {
            BookFavorite favorite = new BookFavorite();
            favorite.setUser(userRepository.getReferenceById(user.id()));
            favorite.setBook(bookRepository.getReferenceById(bookId));
            bookFavoriteRepository.save(favorite);
        }
        return true;
    }

    @Transactional
    public void removeFavoriteBook(Long userId, Long bookId) {
        bookFavoriteRepository.deleteByUserIdAndBookId(userId, bookId);
    }

    private List<BookSummary> toBookSummaries(Long userId, List<Book> books) {
        if (books.isEmpty()) {
            return List.of();
        }
        List<Long> bookIds = books.stream().map(Book::getId).toList();
        List<Course> lessons = courseRepository.findByBookIdInAndStatusOrderBySortOrderAscIdAsc(
            bookIds, CourseStatus.PUBLISHED);
        Map<Long, Long> lessonCountByBook = lessons.stream().collect(Collectors.groupingBy(
            lesson -> lesson.getBook().getId(), Collectors.counting()));
        List<Long> lessonIds = lessons.stream().map(Course::getId).toList();
        Set<Long> completedIds = lessonIds.isEmpty()
            ? Set.of()
            : Set.copyOf(learningRecordRepository.findCompletedCourseIds(userId, lessonIds));
        Map<Long, Long> completedByBook = lessons.stream()
            .filter(lesson -> completedIds.contains(lesson.getId()))
            .collect(Collectors.groupingBy(
                lesson -> lesson.getBook().getId(), Collectors.counting()));
        Set<Long> bookFavoriteIds = Set.copyOf(bookFavoriteRepository.findFavoriteBookIds(userId, bookIds));
        Set<Long> lessonFavoriteBookIds = Set.copyOf(favoriteRepository.findFavoriteBookIdsViaLessons(userId));
        return books.stream().map(book -> {
            long count = lessonCountByBook.getOrDefault(book.getId(), 0L);
            long completed = completedByBook.getOrDefault(book.getId(), 0L);
            int progress = count == 0 ? 0 : (int) Math.round(completed * 100.0 / count);
            boolean favorite = bookFavoriteIds.contains(book.getId())
                || lessonFavoriteBookIds.contains(book.getId());
            return toBookSummary(book, (int) count, progress, favorite);
        }).toList();
    }

    private Set<Long> favoriteIds(Long userId, List<Course> courses) {
        if (courses.isEmpty()) {
            return Set.of();
        }
        return Set.copyOf(favoriteRepository.findFavoriteCourseIds(
            userId, courses.stream().map(Course::getId).toList()));
    }

    private Map<Long, LearningRecord> recordsByCourse(Long userId, List<Course> courses) {
        if (courses.isEmpty()) {
            return Map.of();
        }
        return learningRecordRepository.findByUserIdAndCourseIds(
                userId,
                courses.stream().map(Course::getId).toList())
            .stream()
            .collect(Collectors.toMap(
                record -> record.getCourse().getId(),
                record -> record));
    }

    private int recordProgress(LearningRecord record) {
        return Math.round(
            (record.getListenProgress() + record.getReadProgress()
                + record.getWriteProgress() + record.getSpeakProgress()) / 4.0f);
    }

    private PageRequest pageRequest(int page, int size) {
        return PageRequest.of(
            Math.max(0, page),
            Math.min(200, Math.max(1, size)),
            Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.desc("id")));
    }

    private CategoryView toCategoryView(CourseCategory category) {
        return new CategoryView(
            category.getId(),
            category.getName(),
            category.getDescription(),
            mediaUrl(category.getCoverObjectKey()),
            category.getThemeColorPrimary(),
            category.getThemeColorSecondary());
    }

    private BookSummary toBookSummary(Book book, int lessonCount, int progress, boolean favorite) {
        return new BookSummary(
            book.getId(),
            book.getTitle(),
            book.getDescription(),
            book.getCategory().getId(),
            book.getCategory().getName(),
            mediaUrl(book.getCoverObjectKey()),
            mediaUrl(book.getCoverThumbnailObjectKey()),
            book.getThemeColorPrimary(),
            book.getThemeColorSecondary(),
            book.getSpineColor(),
            lessonCount,
            progress,
            favorite);
    }

    private RecentLesson toRecentLesson(LearningRecord record) {
        Course course = record.getCourse();
        Book book = course.getBook();
        int progress = Math.round((record.getListenProgress() + record.getReadProgress()
            + record.getWriteProgress() + record.getSpeakProgress()) / 4.0f);
        return new RecentLesson(
            course.getId(),
            book.getId(),
            course.getTitle(),
            book.getTitle(),
            mediaUrl(coverKey(book)),
            book.getThemeColorPrimary(),
            book.getThemeColorSecondary(),
            progress,
            record.getLastStudiedAt());
    }

    private CourseSummary toSummary(Course course, int progress, boolean favorite) {
        return toSummary(course, progress, null, favorite);
    }

    private CourseSummary toSummary(Course course, LearningRecord record, boolean favorite) {
        return toSummary(course, record == null ? 0 : recordProgress(record), record, favorite);
    }

    private CourseSummary toSummary(
        Course course,
        int progress,
        LearningRecord record,
        boolean favorite
    ) {
        String lastCueText = record != null && record.getLastCue() != null
            ? record.getLastCue().getEnglishText()
            : null;
        int lastCueSequenceNo = record != null && record.getLastCue() != null
            ? record.getLastCue().getSequenceNo()
            : 0;
        long remainingDurationMs = Math.round(
            course.getDurationMs() * Math.max(0, 100 - progress) / 100.0);
        return new CourseSummary(
            course.getId(),
            course.getBook().getId(),
            course.getTitle(),
            course.getDescription(),
            course.getCategory().getId(),
            course.getCategory().getName(),
            mediaUrl(course.getCoverObjectKey()),
            course.getThemeColorPrimary(),
            course.getThemeColorSecondary(),
            course.getDurationMs(),
            progress,
            lastCueText,
            lastCueSequenceNo,
            remainingDurationMs,
            favorite);
    }

    private CueView toCueView(SubtitleCue cue) {
        return new CueView(
            cue.getId(),
            cue.getSequenceNo(),
            cue.getStartMs(),
            cue.getEndMs(),
            cue.getEnglishText(),
            cue.getChineseText());
    }

    private String mediaUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }
        if (objectKey.startsWith("http://") || objectKey.startsWith("https://") || objectKey.startsWith("/")) {
            return objectKey;
        }
        return storageService.presignDownload(objectKey);
    }

    private String coverKey(Book book) {
        return book.getCoverThumbnailObjectKey() != null
            ? book.getCoverThumbnailObjectKey()
            : book.getCoverObjectKey();
    }
}
