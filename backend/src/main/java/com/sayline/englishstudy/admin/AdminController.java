package com.sayline.englishstudy.admin;

import java.util.List;

import com.sayline.englishstudy.admin.AdminDtos.BookAdminView;
import com.sayline.englishstudy.admin.AdminDtos.BookRequest;
import com.sayline.englishstudy.admin.AdminDtos.BatchVisibilityRequest;
import com.sayline.englishstudy.admin.AdminDtos.BatchCourseStatusRequest;
import com.sayline.englishstudy.admin.AdminDtos.CategoryAdminView;
import com.sayline.englishstudy.admin.AdminDtos.CategoryRequest;
import com.sayline.englishstudy.admin.AdminDtos.CourseAdminView;
import com.sayline.englishstudy.admin.AdminDtos.CourseRequest;
import com.sayline.englishstudy.admin.AdminDtos.DashboardView;
import com.sayline.englishstudy.admin.AdminDtos.UserAdminView;
import com.sayline.englishstudy.admin.AdminDtos.UserStatusRequest;
import com.sayline.englishstudy.admin.ImportDtos.ImportExecuteRequest;
import com.sayline.englishstudy.admin.ImportDtos.ImportJobView;
import com.sayline.englishstudy.admin.ImportDtos.ImportPreviewRequest;
import com.sayline.englishstudy.admin.ImportDtos.ImportPreviewView;
import com.sayline.englishstudy.admin.OperationsDtos.ContentHealthView;
import com.sayline.englishstudy.auth.AuthenticatedUser;
import com.sayline.englishstudy.auth.AccountSecurityService;
import com.sayline.englishstudy.user.UserProfileDtos.PasswordResetTokenView;
import com.sayline.englishstudy.catalog.CourseStatus;
import com.sayline.englishstudy.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AdminImportService importService;
    private final AccountSecurityService accountSecurityService;
    private final OperationsService operationsService;
    private final AdminAuditService auditService;

    public AdminController(
        AdminService adminService,
        AdminImportService importService,
        AccountSecurityService accountSecurityService,
        OperationsService operationsService,
        AdminAuditService auditService
    ) {
        this.adminService = adminService;
        this.importService = importService;
        this.accountSecurityService = accountSecurityService;
        this.operationsService = operationsService;
        this.auditService = auditService;
    }

    @GetMapping("/dashboard")
    public DashboardView dashboard() {
        return adminService.dashboard();
    }

    @GetMapping("/content-health")
    public ContentHealthView contentHealth() {
        return operationsService.contentHealth();
    }

    @GetMapping("/categories")
    public PageResponse<CategoryAdminView> categories(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.categories(page, size);
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryAdminView> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createCategory(request));
    }

    @PatchMapping("/categories/{categoryId}")
    public CategoryAdminView updateCategory(
        @PathVariable Long categoryId,
        @Valid @RequestBody CategoryRequest request
    ) {
        return adminService.updateCategory(categoryId, request);
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long categoryId
    ) {
        adminService.deleteCategory(categoryId);
        auditService.log(user, "DELETE_CATEGORY", "CATEGORY", categoryId, null);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/books")
    public PageResponse<BookAdminView> books(
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) Boolean visible,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.books(categoryId, q, visible, page, size);
    }

    @PostMapping("/books")
    public ResponseEntity<BookAdminView> createBook(@Valid @RequestBody BookRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createBook(request));
    }

    @PatchMapping("/books/{bookId}")
    public BookAdminView updateBook(
        @PathVariable Long bookId,
        @Valid @RequestBody BookRequest request
    ) {
        return adminService.updateBook(bookId, request);
    }

    @DeleteMapping("/books/{bookId}")
    public ResponseEntity<Void> deleteBook(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long bookId
    ) {
        adminService.deleteBook(bookId);
        auditService.log(user, "DELETE_BOOK", "BOOK", bookId, null);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/books/batch-visibility")
    public ResponseEntity<Void> batchBookVisibility(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody BatchVisibilityRequest request
    ) {
        adminService.batchBookVisibility(request);
        auditService.log(
            user,
            "BATCH_BOOK_VISIBILITY",
            "BOOK",
            null,
            "visible=" + request.visible() + ", count=" + request.bookIds().size());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/imports/preview")
    public ImportPreviewView previewImport(@Valid @RequestBody ImportPreviewRequest request) {
        return importService.preview(request);
    }

    @PostMapping("/imports")
    public ImportJobView executeImport(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody ImportExecuteRequest request
    ) {
        return importService.execute(user, request);
    }

    @GetMapping("/imports")
    public PageResponse<ImportJobView> imports(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return importService.jobs(page, size);
    }

    @PostMapping("/imports/{jobId}/rollback")
    public ImportJobView rollbackImport(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long jobId
    ) {
        return importService.rollback(user, jobId);
    }

    @GetMapping("/courses")
    public PageResponse<CourseAdminView> courses(
        @RequestParam(required = false) Long bookId,
        @RequestParam(required = false) CourseStatus status,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.courses(bookId, status, q, page, size);
    }

    @GetMapping("/courses/{courseId}")
    public CourseAdminView course(@PathVariable Long courseId) {
        return adminService.course(courseId);
    }

    @PostMapping("/courses")
    public ResponseEntity<CourseAdminView> createCourse(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody CourseRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createCourse(user, request));
    }

    @PatchMapping("/courses/{courseId}")
    public CourseAdminView updateCourse(
        @PathVariable Long courseId,
        @Valid @RequestBody CourseRequest request
    ) {
        return adminService.updateCourse(courseId, request);
    }

    @PostMapping("/courses/{courseId}/publish")
    public CourseAdminView publish(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long courseId
    ) {
        CourseAdminView result = adminService.publish(courseId);
        auditService.log(user, "PUBLISH_COURSE", "COURSE", courseId, null);
        return result;
    }

    @PostMapping("/courses/{courseId}/offline")
    public CourseAdminView offline(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long courseId
    ) {
        CourseAdminView result = adminService.offline(courseId);
        auditService.log(user, "OFFLINE_COURSE", "COURSE", courseId, null);
        return result;
    }

    @PatchMapping("/courses/batch-status")
    public ResponseEntity<Void> batchCourseStatus(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody BatchCourseStatusRequest request
    ) {
        adminService.batchCourseStatus(request);
        auditService.log(
            user,
            "BATCH_COURSE_STATUS",
            "COURSE",
            null,
            "status=" + request.status() + ", count=" + request.courseIds().size());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/courses/{courseId}")
    public ResponseEntity<Void> deleteCourse(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long courseId
    ) {
        adminService.deleteCourse(courseId);
        auditService.log(user, "DELETE_COURSE", "COURSE", courseId, null);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public PageResponse<UserAdminView> users(
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.users(q, page, size);
    }

    @PatchMapping("/users/{userId}/status")
    public UserAdminView updateUserStatus(
        @AuthenticationPrincipal AuthenticatedUser actor,
        @PathVariable Long userId,
        @Valid @RequestBody UserStatusRequest request
    ) {
        UserAdminView result = adminService.updateUserStatus(userId, request.status());
        auditService.log(actor, "UPDATE_USER_STATUS", "USER", userId, "status=" + request.status());
        return result;
    }

    @PostMapping("/users/{userId}/password-reset-token")
    public PasswordResetTokenView issuePasswordResetToken(
        @AuthenticationPrincipal AuthenticatedUser actor,
        @PathVariable Long userId
    ) {
        PasswordResetTokenView token = accountSecurityService.issuePasswordResetToken(userId);
        auditService.log(actor, "ISSUE_PASSWORD_RESET", "USER", userId, null);
        return token;
    }
}
