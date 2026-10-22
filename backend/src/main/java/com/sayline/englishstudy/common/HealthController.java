package com.sayline.englishstudy.common;

import java.sql.Connection;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("ok");
    }

    @GetMapping("/ready")
    public ResponseEntity<HealthResponse> ready() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                return ResponseEntity.ok(new HealthResponse("ok"));
            }
        } catch (SQLException ignored) {
            // The readiness response intentionally omits internal connection details.
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new HealthResponse("degraded"));
    }

    public record HealthResponse(String status) {
    }
}
