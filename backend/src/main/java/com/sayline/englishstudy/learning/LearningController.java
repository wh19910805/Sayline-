package com.sayline.englishstudy.learning;

import java.time.LocalDate;
import java.util.Locale;

import com.sayline.englishstudy.auth.AuthenticatedUser;
import com.sayline.englishstudy.learning.LearningDtos.ActionRequest;
import com.sayline.englishstudy.learning.LearningDtos.ConfirmRequest;
import com.sayline.englishstudy.learning.LearningDtos.HeartbeatRequest;
import com.sayline.englishstudy.learning.LearningDtos.HeartbeatResponse;
import com.sayline.englishstudy.learning.LearningDtos.LearningState;
import com.sayline.englishstudy.learning.LearningDtos.PositionRequest;
import com.sayline.englishstudy.learning.LearningDtos.StatsResponse;
import com.sayline.englishstudy.learning.ReviewDtos.ReviewCue;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/learning")
public class LearningController {

    private final LearningService learningService;
    private final LearningStatsService statsService;
    private final ReviewService reviewService;

    public LearningController(
        LearningService learningService,
        LearningStatsService statsService,
        ReviewService reviewService
    ) {
        this.learningService = learningService;
        this.statsService = statsService;
        this.reviewService = reviewService;
    }

    @GetMapping("/courses/{courseId}")
    public LearningState state(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long courseId
    ) {
        return learningService.state(user, courseId);
    }

    @PostMapping("/courses/{courseId}/actions")
    public LearningState action(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long courseId,
        @Valid @RequestBody ActionRequest request
    ) {
        return learningService.performAction(user, courseId, request);
    }

    @PostMapping("/courses/{courseId}/position")
    public LearningState position(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long courseId,
        @Valid @RequestBody PositionRequest request
    ) {
        return learningService.updatePosition(user, courseId, request);
    }

    @PostMapping("/courses/{courseId}/confirm")
    public LearningState confirm(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long courseId,
        @Valid @RequestBody ConfirmRequest request
    ) {
        return learningService.confirmMode(user, courseId, request);
    }

    @PostMapping("/courses/{courseId}/heartbeat")
    public HeartbeatResponse heartbeat(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long courseId,
        @Valid @RequestBody HeartbeatRequest request
    ) {
        return learningService.heartbeat(user, courseId, request);
    }

    @GetMapping("/stats")
    public StatsResponse stats(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam(defaultValue = "WEEK") String period,
        @RequestParam(required = false) LocalDate date
    ) {
        return statsService.stats(user.id(), period.toUpperCase(Locale.ROOT), date);
    }

    @GetMapping("/reviews")
    public java.util.List<ReviewCue> reviews(@AuthenticationPrincipal AuthenticatedUser user) {
        return reviewService.reviews(user.id());
    }
}
