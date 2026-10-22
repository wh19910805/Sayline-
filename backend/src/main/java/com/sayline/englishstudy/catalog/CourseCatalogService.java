package com.sayline.englishstudy.catalog;

import java.util.List;
import java.util.Set;

import com.sayline.englishstudy.auth.AuthenticatedUser;
import com.sayline.englishstudy.catalog.CatalogDtos.CategoryView;
import com.sayline.englishstudy.catalog.CatalogDtos.CourseDetail;
import com.sayline.englishstudy.catalog.CatalogDtos.CourseSummary;
import com.sayline.englishstudy.catalog.CatalogDtos.CueView;
import com.sayline.englishstudy.common.ApiException;
import com.sayline.englishstudy.common.PageResponse;
import com.sayline.englishstudy.learning.CourseFavorite;
import com.sayline.englishstudy.learning.CourseFavoriteRepository;
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
    private final UserRepository userRepository;
    private final StorageService storageService;

    public CourseCatalogService(
        CourseCategoryRepository categoryRepository,
        CourseRepository courseRepository,
        SubtitleCueRepository cueRepository,
        CourseFavoriteRepository favoriteRepository,
        UserRepository userRepository,
        StorageService storageService
    ) {
        this.categoryRepository = categoryRepository;
        this.courseRepository = courseRepository;
        this.cueRepository = cueRepository;
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
    }

    @Transactional(readOnly = true)
    public List<CategoryView> categories() {
        return categoryRepository.findByVisibleTrueOrderBySortOrderAscNameAsc().stream()
            .map(this::toCategoryView)
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
        return PageResponse.from(courses.map(course -> toSummary(course, favoriteIds.contains(course.getId()))));
    }

    @Transactional(readOnly = true)
    public PageResponse<CourseSummary> favorites(Long userId, int page, int size) {
        PageRequest pageRequest = pageRequest(page, size)
            .withSort(Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        return PageResponse.from(favoriteRepository.findPublishedFavorites(userId, pageRequest)
            .map(favorite -> toSummary(favorite.getCourse(), true)));
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

    private Set<Long> favoriteIds(Long userId, List<Course> courses) {
        if (courses.isEmpty()) {
            return Set.of();
        }
        return Set.copyOf(favoriteRepository.findFavoriteCourseIds(
            userId, courses.stream().map(Course::getId).toList()));
    }

    private PageRequest pageRequest(int page, int size) {
        return PageRequest.of(
            Math.max(0, page),
            Math.min(50, Math.max(1, size)),
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

    private CourseSummary toSummary(Course course, boolean favorite) {
        return new CourseSummary(
            course.getId(),
            course.getTitle(),
            course.getDescription(),
            course.getCategory().getId(),
            course.getCategory().getName(),
            mediaUrl(course.getCoverObjectKey()),
            course.getThemeColorPrimary(),
            course.getThemeColorSecondary(),
            course.getDurationMs(),
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
}
