package com.sayline.englishstudy.user;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;

import com.sayline.englishstudy.auth.AuthenticatedUser;
import com.sayline.englishstudy.catalog.CourseCategory;
import com.sayline.englishstudy.catalog.CourseCategoryRepository;
import com.sayline.englishstudy.catalog.CatalogDtos.CategoryView;
import com.sayline.englishstudy.common.ApiException;
import com.sayline.englishstudy.storage.StorageService;
import com.sayline.englishstudy.user.UserProfileDtos.InterestsUpdate;
import com.sayline.englishstudy.user.UserProfileDtos.ProfileUpdate;
import com.sayline.englishstudy.user.UserProfileDtos.ProfileView;
import com.sayline.englishstudy.user.UserProfileDtos.SettingsUpdate;
import com.sayline.englishstudy.user.UserProfileDtos.SettingsView;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserSettingsRepository settingsRepository;
    private final UserInterestRepository interestRepository;
    private final CourseCategoryRepository categoryRepository;
    private final StorageService storageService;

    public UserProfileService(
        UserRepository userRepository,
        UserSettingsRepository settingsRepository,
        UserInterestRepository interestRepository,
        CourseCategoryRepository categoryRepository,
        StorageService storageService
    ) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.interestRepository = interestRepository;
        this.categoryRepository = categoryRepository;
        this.storageService = storageService;
    }

    @Transactional(readOnly = true)
    public ProfileView profile(AuthenticatedUser principal) {
        return toView(requiredUser(principal.id()));
    }

    @Transactional
    public ProfileView updateProfile(AuthenticatedUser principal, ProfileUpdate request) {
        User user = requiredUser(principal.id());
        user.setNickname(request.nickname().trim());
        user.setAvatarObjectKey(blankToNull(request.avatarObjectKey()));
        return toView(user);
    }

    @Transactional
    public SettingsView settings(AuthenticatedUser principal) {
        return toView(settingsFor(principal.id()));
    }

    @Transactional
    public SettingsView updateSettings(AuthenticatedUser principal, SettingsUpdate request) {
        UserSettings settings = settingsFor(principal.id());
        if (request.fontScale() != null) {
            settings.setFontScale(request.fontScale());
        }
        if (request.subtitleColor() != null) {
            settings.setSubtitleColor(request.subtitleColor().toUpperCase());
        }
        if (request.showChineseListen() != null) {
            settings.setShowChineseListen(request.showChineseListen());
        }
        if (request.showChineseRead() != null) {
            settings.setShowChineseRead(request.showChineseRead());
        }
        if (request.showChineseWrite() != null) {
            settings.setShowChineseWrite(request.showChineseWrite());
        }
        if (request.showChineseSpeak() != null) {
            settings.setShowChineseSpeak(request.showChineseSpeak());
        }
        if (request.defaultCategoryId() != null) {
            settings.setDefaultCategory(requiredCategory(request.defaultCategoryId()));
        }
        return toView(settings);
    }

    @Transactional(readOnly = true)
    public List<CategoryView> interests(AuthenticatedUser principal) {
        return interestRepository.findByUserIdOrderBySortOrderAsc(principal.id()).stream()
            .map(UserInterest::getCategory)
            .map(this::toView)
            .toList();
    }

    @Transactional
    public List<CategoryView> updateInterests(AuthenticatedUser principal, InterestsUpdate request) {
        List<Long> categoryIds = request.categoryIds() == null
            ? List.of()
            : List.copyOf(new LinkedHashSet<>(request.categoryIds()));
        List<CourseCategory> categories = categoryRepository.findAllById(categoryIds);
        if (categories.size() != categoryIds.size()) {
            throw new ApiException("CATEGORY_NOT_FOUND", HttpStatus.UNPROCESSABLE_ENTITY, "包含不存在的课程分类");
        }

        interestRepository.deleteByUserId(principal.id());
        User user = requiredUser(principal.id());
        for (int index = 0; index < categoryIds.size(); index++) {
            Long categoryId = categoryIds.get(index);
            UserInterest interest = new UserInterest();
            interest.setUser(user);
            interest.setCategory(categories.stream()
                .filter(category -> category.getId().equals(categoryId))
                .findFirst()
                .orElseThrow());
            interest.setSortOrder(index);
            interestRepository.save(interest);
        }

        UserSettings settings = settingsFor(principal.id());
        settings.setDefaultCategory(categoryIds.isEmpty() ? null : requiredCategory(categoryIds.getFirst()));
        return categoryIds.stream().map(this::requiredCategory).map(this::toView).toList();
    }

    private User requiredUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("USER_NOT_FOUND", HttpStatus.NOT_FOUND, "用户不存在"));
    }

    private CourseCategory requiredCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
            .orElseThrow(() -> new ApiException("CATEGORY_NOT_FOUND", HttpStatus.UNPROCESSABLE_ENTITY, "课程分类不存在"));
    }

    private UserSettings settingsFor(Long userId) {
        return settingsRepository.findByUserId(userId).orElseGet(() -> {
            UserSettings settings = new UserSettings();
            settings.setUser(requiredUser(userId));
            settings.setFontScale(BigDecimal.ONE);
            settings.setSubtitleColor("#F8F2E8");
            return settingsRepository.save(settings);
        });
    }

    private ProfileView toView(User user) {
        return new ProfileView(
            user.getId(),
            user.getPhone(),
            user.getNickname(),
            mediaUrl(user.getAvatarObjectKey()));
    }

    private SettingsView toView(UserSettings settings) {
        return new SettingsView(
            settings.getFontScale(),
            settings.getSubtitleColor(),
            settings.isShowChineseListen(),
            settings.isShowChineseRead(),
            settings.isShowChineseWrite(),
            settings.isShowChineseSpeak(),
            settings.getDefaultCategory() == null ? null : settings.getDefaultCategory().getId());
    }

    private CategoryView toView(CourseCategory category) {
        return new CategoryView(
            category.getId(),
            category.getName(),
            category.getDescription(),
            category.getCoverObjectKey(),
            category.getThemeColorPrimary(),
            category.getThemeColorSecondary());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
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
