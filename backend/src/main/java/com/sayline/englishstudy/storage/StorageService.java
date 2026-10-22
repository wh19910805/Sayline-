package com.sayline.englishstudy.storage;

public interface StorageService {

    String presignUpload(UploadKind kind, String objectKey, long sizeBytes);

    String presignDownload(String objectKey);

    String readText(String objectKey);
}
