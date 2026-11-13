package com.sayline.englishstudy.storage;

import java.net.URI;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class S3StorageServiceTest {

    @Test
    void presignedDownloadsRequestLongLivedBrowserCaching() {
        S3StorageService storage = new S3StorageService(
            "http://localhost:9000",
            "http://localhost:9000",
            "test-access",
            "test-secret",
            "sayline-media",
            "us-east-1"
        );

        URI url = URI.create(storage.presignDownload("covers/example_thumb.jpg"));

        assertTrue(url.getQuery().contains("response-cache-control="));
        assertTrue(url.getQuery().contains("public, max-age=31536000, immutable"));
    }
}
