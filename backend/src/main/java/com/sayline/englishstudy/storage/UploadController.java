package com.sayline.englishstudy.storage;

import com.sayline.englishstudy.storage.UploadDtos.PresignRequest;
import com.sayline.englishstudy.storage.UploadDtos.PresignResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/uploads")
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping("/presign")
    @PreAuthorize("hasRole('ADMIN')")
    public PresignResponse presign(@Valid @RequestBody PresignRequest request) {
        return uploadService.presign(request);
    }
}
