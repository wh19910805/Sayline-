package com.sayline.englishstudy.catalog;

import java.util.List;

import com.sayline.englishstudy.auth.AuthenticatedUser;
import com.sayline.englishstudy.catalog.CatalogDtos.BookDetail;
import com.sayline.englishstudy.catalog.CatalogDtos.BookSummary;
import com.sayline.englishstudy.catalog.CatalogDtos.CategoryView;
import com.sayline.englishstudy.catalog.CatalogDtos.CourseDetail;
import com.sayline.englishstudy.catalog.CatalogDtos.CourseSummary;
import com.sayline.englishstudy.catalog.CatalogDtos.FavoriteState;
import com.sayline.englishstudy.catalog.CatalogDtos.RecentLesson;
import com.sayline.englishstudy.common.PageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {

    private final CourseCatalogService catalogService;

    public CatalogController(CourseCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/categories")
    public List<CategoryView> categories() {
        return catalogService.categories();
    }

    @GetMapping("/books")
    public List<BookSummary> books(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam(required = false) Long categoryId
    ) {
        return catalogService.books(user.id(), categoryId);
    }

    @GetMapping("/books/{bookId}")
    public BookDetail book(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long bookId
    ) {
        return catalogService.book(user.id(), bookId);
    }

    @GetMapping("/favorite-books")
    public List<BookSummary> favoriteBooks(@AuthenticationPrincipal AuthenticatedUser user) {
        return catalogService.favoriteBooks(user.id());
    }

    @GetMapping("/recent-lessons")
    public List<RecentLesson> recentLessons(@AuthenticationPrincipal AuthenticatedUser user) {
        return catalogService.recentLessons(user.id());
    }

    @PostMapping("/books/{bookId}/favorite")
    public FavoriteState favoriteBook(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long bookId
    ) {
        return new FavoriteState(catalogService.addFavoriteBook(user, bookId));
    }

    @DeleteMapping("/books/{bookId}/favorite")
    public ResponseEntity<Void> unfavoriteBook(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long bookId
    ) {
        catalogService.removeFavoriteBook(user.id(), bookId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/courses")
    public PageResponse<CourseSummary> courses(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return catalogService.courses(user.id(), categoryId, q, page, size);
    }

    @GetMapping("/courses/{courseId}")
    public CourseDetail course(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long courseId
    ) {
        return catalogService.course(user.id(), courseId);
    }

    @GetMapping("/favorites")
    public PageResponse<CourseSummary> favorites(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return catalogService.favorites(user.id(), page, size);
    }

    @PostMapping("/courses/{courseId}/favorite")
    public FavoriteState favorite(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long courseId
    ) {
        return new FavoriteState(catalogService.addFavorite(user, courseId));
    }

    @DeleteMapping("/courses/{courseId}/favorite")
    public ResponseEntity<Void> unfavorite(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable Long courseId
    ) {
        catalogService.removeFavorite(user.id(), courseId);
        return ResponseEntity.noContent().build();
    }
}
