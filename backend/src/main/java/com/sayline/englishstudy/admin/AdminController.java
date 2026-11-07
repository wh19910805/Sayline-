package com.sayline.englishstudy.admin;

import java.util.List;

import com.sayline.englishstudy.admin.AdminDtos.BookAdminView;
import com.sayline.englishstudy.admin.AdminDtos.BookRequest;
import com.sayline.englishstudy.admin.AdminDtos.CategoryAdminView;
import com.sayline.englishstudy.admin.AdminDtos.CategoryRequest;
import com.sayline.englishstudy.admin.AdminDtos.CourseAdminView;
import com.sayline.englishstudy.admin.AdminDtos.CourseRequest;
import com.sayline.englishstudy.admin.AdminDtos.DashboardView;
import com.sayline.englishstudy.admin.AdminDtos.UserAdminView;
import com.sayline.englishstudy.admin.AdminDtos.UserStatusRequest;
import com.sayline.englishstudy.auth.AuthenticatedUser;
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

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public DashboardView dashboard() {
        return adminService.dashboard();
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
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        adminService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/books")
    public PageResponse<BookAdminView> books(
        @RequestParam(required = false) Long categoryId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.books(categoryId, page, size);
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
    public ResponseEntity<Void> deleteBook(@PathVariable Long bookId) {
        adminService.deleteBook(bookId);
        return ResponseEntity.noContent().build();
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
    public CourseAdminView publish(@PathVariable Long courseId) {
        return adminService.publish(courseId);
    }

    @PostMapping("/courses/{courseId}/offline")
    public CourseAdminView offline(@PathVariable Long courseId) {
        return adminService.offline(courseId);
    }

    @DeleteMapping("/courses/{courseId}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long courseId) {
        adminService.deleteCourse(courseId);
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
        @PathVariable Long userId,
        @Valid @RequestBody UserStatusRequest request
    ) {
        return adminService.updateUserStatus(userId, request.status());
    }
}
