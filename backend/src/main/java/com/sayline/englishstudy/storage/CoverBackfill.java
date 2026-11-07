package com.sayline.englishstudy.storage;

import java.util.List;

import com.sayline.englishstudy.catalog.Book;
import com.sayline.englishstudy.catalog.BookRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** 启动时回填：给「有封面但还没算过缩略图」的旧书补缩略图 + 书脊色。 */
@Component
public class CoverBackfill implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CoverBackfill.class);

    private final BookRepository bookRepository;
    private final CoverImageService coverImageService;

    public CoverBackfill(BookRepository bookRepository, CoverImageService coverImageService) {
        this.bookRepository = bookRepository;
        this.coverImageService = coverImageService;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<Book> books = bookRepository.findByCoverObjectKeyIsNotNullAndCoverThumbnailObjectKeyIsNull();
        for (Book book : books) {
            coverImageService.process(book);
            bookRepository.save(book);
        }
        if (!books.isEmpty()) {
            log.info("已回填 {} 本书的封面缩略图与书脊色", books.size());
        }
    }
}
