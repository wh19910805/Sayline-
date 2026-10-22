package com.sayline.englishstudy.user;

import java.util.List;

import com.sayline.englishstudy.auth.AuthenticatedUser;
import com.sayline.englishstudy.catalog.CatalogDtos.CategoryView;
import com.sayline.englishstudy.user.UserProfileDtos.InterestsUpdate;
import com.sayline.englishstudy.user.UserProfileDtos.ProfileUpdate;
import com.sayline.englishstudy.user.UserProfileDtos.ProfileView;
import com.sayline.englishstudy.user.UserProfileDtos.SettingsUpdate;
import com.sayline.englishstudy.user.UserProfileDtos.SettingsView;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
public class UserProfileController {

    private final UserProfileService profileService;

    public UserProfileController(UserProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/profile")
    public ProfileView profile(@AuthenticationPrincipal AuthenticatedUser user) {
        return profileService.profile(user);
    }

    @PatchMapping("/profile")
    public ProfileView updateProfile(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody ProfileUpdate request
    ) {
        return profileService.updateProfile(user, request);
    }

    @GetMapping("/settings")
    public SettingsView settings(@AuthenticationPrincipal AuthenticatedUser user) {
        return profileService.settings(user);
    }

    @PatchMapping("/settings")
    public SettingsView updateSettings(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody SettingsUpdate request
    ) {
        return profileService.updateSettings(user, request);
    }

    @GetMapping("/interests")
    public List<CategoryView> interests(@AuthenticationPrincipal AuthenticatedUser user) {
        return profileService.interests(user);
    }

    @PutMapping("/interests")
    public List<CategoryView> updateInterests(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody InterestsUpdate request
    ) {
        return profileService.updateInterests(user, request);
    }
}
