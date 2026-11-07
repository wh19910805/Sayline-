package com.sayline.englishstudy.storage;

public interface StorageService {

    String presignUpload(UploadKind kind, String objectKey, long sizeBytes);

    String presignDownload(String objectKey);

    String readText(String objectKey);

    byte[] readBytes(String objectKey);

    void uploadBytes(String objectKey, String contentType, byte[] bytes);
}
