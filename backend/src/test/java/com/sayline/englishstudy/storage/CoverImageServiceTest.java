package com.sayline.englishstudy.storage;

import com.sayline.englishstudy.catalog.Book;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CoverImageServiceTest {

    @Mock
    private StorageService storageService;

    @Test
    void ignoresMissingCoverBytes() {
        Book book = new Book();
        book.setCoverObjectKey("covers/missing.jpg");
        when(storageService.readBytes("covers/missing.jpg")).thenReturn(null);

        assertDoesNotThrow(() -> new CoverImageService(storageService).process(book));
        assertNull(book.getCoverThumbnailObjectKey());
    }
}
