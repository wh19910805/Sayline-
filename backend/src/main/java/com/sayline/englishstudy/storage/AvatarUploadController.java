package com.sayline.englishstudy.storage;

import com.sayline.englishstudy.common.ApiException;
import com.sayline.englishstudy.storage.UploadDtos.PresignRequest;
import com.sayline.englishstudy.storage.UploadDtos.PresignResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/uploads/avatar")
public class AvatarUploadController {

    private final UploadService uploadService;

    public AvatarUploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping("/presign")
    public PresignResponse presign(@Valid @RequestBody PresignRequest request) {
        if (request.kind() != UploadKind.COVER) {
            throw new ApiException("INVALID_UPLOAD_TYPE", HttpStatus.UNPROCESSABLE_ENTITY, "头像必须是图片文件");
        }
        return uploadService.presign(request);
    }
}
