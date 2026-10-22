package com.sayline.englishstudy.storage;

import java.time.Instant;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class UploadDtos {

    private UploadDtos() {
    }

    public record PresignRequest(
        @NotNull UploadKind kind,
        @NotBlank String fileName,
        @NotBlank String contentType,
        @Min(1) long sizeBytes
    ) {
    }

    public record PresignResponse(String uploadUrl, String objectKey, Instant expiresAt) {
    }
}
