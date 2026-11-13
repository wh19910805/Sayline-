package com.sayline.englishstudy.admin;

import java.time.Instant;
import java.util.List;

public final class OperationsDtos {

    private OperationsDtos() {
    }

    public record HealthIssue(String severity, String type, String message, Long entityId) {
    }

    public record FailedImportView(
        Long id,
        ImportType type,
        ImportStatus status,
        int failed,
        Instant createdAt
    ) {
    }

    public record AuditLogView(
        Long id,
        Long actorId,
        String action,
        String entityType,
        String entityId,
        String detail,
        Instant createdAt
    ) {
    }

    public record ContentHealthView(
        int publishedCourses,
        int missingMediaCourses,
        int missingSubtitleCourses,
        int duplicateAudioGroups,
        int orphanObjectCount,
        List<HealthIssue> issues,
        List<FailedImportView> failedImports,
        List<AuditLogView> auditLogs
    ) {
    }
}
