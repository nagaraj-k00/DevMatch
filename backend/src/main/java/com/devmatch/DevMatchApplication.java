package com.devmatch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@SpringBootApplication
@EnableScheduling
@RestController
public class DevMatchApplication {

    public static void main(String[] args) {
        SpringApplication.run(DevMatchApplication.class, args);
    }

    @GetMapping("/api/health")
    public Map<String, Object> healthCheck() {
        return Map.of(
                "status", "UP",
                "service", "DevMatch AI Backend",
                "version", "1.0.0",
                "stack", "Java 21 / Spring Boot 3 / MongoDB"
        );
    }
}
