package com.sayline.englishstudy.storage;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.sayline.englishstudy.common.ApiException;
import com.sayline.englishstudy.storage.UploadDtos.PresignRequest;
import com.sayline.englishstudy.storage.UploadDtos.PresignResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class UploadService {

    private static final Map<UploadKind, Policy> POLICIES = Map.of(
        UploadKind.COVER, new Policy(
            20L * 1024 * 1024,
            Set.of("image/jpeg", "image/png", "image/webp"),
            Set.of("jpg", "jpeg", "png", "webp"),
            "covers"),
        UploadKind.AUDIO, new Policy(
            100L * 1024 * 1024,
            Set.of("audio/mpeg", "audio/mp4", "audio/aac", "audio/x-m4a"),
            Set.of("mp3", "m4a", "aac"),
            "audio"),
        UploadKind.SUBTITLE, new Policy(
            2L * 1024 * 1024,
            Set.of("text/plain", "application/x-subrip", "text/vtt", "text/srt"),
            Set.of("srt", "vtt"),
            "subtitles"));

    private final StorageService storageService;

    public UploadService(StorageService storageService) {
        this.storageService = storageService;
    }

    public PresignResponse presign(PresignRequest request) {
        Policy policy = POLICIES.get(request.kind());
        String contentType = request.contentType().toLowerCase(Locale.ROOT);
        String extension = extension(request.fileName());
        if (!policy.contentTypes().contains(contentType) || !policy.extensions().contains(extension)) {
            throw new ApiException("INVALID_UPLOAD_TYPE", HttpStatus.UNPROCESSABLE_ENTITY, "不支持的文件类型");
        }
        if (request.sizeBytes() > policy.maxBytes()) {
            throw new ApiException("UPLOAD_TOO_LARGE", HttpStatus.UNPROCESSABLE_ENTITY, "文件超过大小限制");
        }
        String objectKey = policy.prefix() + "/" + UUID.randomUUID() + "." + extension;
        String uploadUrl = storageService.presignUpload(request.kind(), objectKey, request.sizeBytes());
        return new PresignResponse(uploadUrl, objectKey, Instant.now().plusSeconds(600));
    }

    private String extension(String fileName) {
        int separator = fileName.lastIndexOf('.');
        if (separator < 0 || separator == fileName.length() - 1) {
            throw new ApiException("INVALID_UPLOAD_TYPE", HttpStatus.UNPROCESSABLE_ENTITY, "文件缺少扩展名");
        }
        return fileName.substring(separator + 1).toLowerCase(Locale.ROOT);
    }

    private record Policy(long maxBytes, Set<String> contentTypes, Set<String> extensions, String prefix) {
    }
}
