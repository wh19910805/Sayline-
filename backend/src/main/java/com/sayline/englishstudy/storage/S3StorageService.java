package com.sayline.englishstudy.storage;

import java.net.URI;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
public class S3StorageService implements StorageService {

    private final S3Client client;
    private final S3Presigner presigner;
    private final String bucket;

    public S3StorageService(
        @Value("${app.storage.endpoint}") String endpoint,
        @Value("${app.storage.access-key}") String accessKey,
        @Value("${app.storage.secret-key}") String secretKey,
        @Value("${app.storage.bucket}") String bucket,
        @Value("${app.storage.region}") String region
    ) {
        StaticCredentialsProvider credentials = StaticCredentialsProvider.create(
            AwsBasicCredentials.create(accessKey, secretKey));
        S3Configuration configuration = S3Configuration.builder().pathStyleAccessEnabled(true).build();
        this.client = S3Client.builder()
            .endpointOverride(URI.create(endpoint))
            .region(Region.of(region))
            .credentialsProvider(credentials)
            .serviceConfiguration(configuration)
            .build();
        this.presigner = S3Presigner.builder()
            .endpointOverride(URI.create(endpoint))
            .region(Region.of(region))
            .credentialsProvider(credentials)
            .serviceConfiguration(configuration)
            .build();
        this.bucket = bucket;
    }

    @Override
    public String presignUpload(UploadKind kind, String objectKey, long sizeBytes) {
        PutObjectRequest request = PutObjectRequest.builder()
            .bucket(bucket)
            .key(objectKey)
            .build();
        return presigner.presignPutObject(PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(10))
                .putObjectRequest(request)
                .build())
            .url()
            .toString();
    }

    @Override
    public String presignDownload(String objectKey) {
        GetObjectRequest request = GetObjectRequest.builder()
            .bucket(bucket)
            .key(objectKey)
            .build();
        return presigner.presignGetObject(GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .getObjectRequest(request)
                .build())
            .url()
            .toString();
    }

    @Override
    public String readText(String objectKey) {
        byte[] bytes = client.getObjectAsBytes(GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build())
            .asByteArray();
        return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
    }
}
