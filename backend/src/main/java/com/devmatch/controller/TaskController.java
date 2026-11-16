package com.devmatch.controller;

import com.devmatch.dto.ApiResponse;
import com.devmatch.dto.TaskDto;
import com.devmatch.model.TaskItem;
import com.devmatch.model.TaskStatus;
import com.devmatch.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @GetMapping("/projects/{id}/tasks")
    public ResponseEntity<ApiResponse<List<TaskItem>>> getTasks(@PathVariable String id) {
        List<TaskItem> tasks = taskService.getProjectTasks(id);
        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }

    @PostMapping("/projects/{id}/tasks")
    public ResponseEntity<ApiResponse<TaskItem>> createTask(
            @PathVariable String id,
            @Valid @RequestBody TaskDto dto) {
        TaskItem item = taskService.createTask(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Task created", item));
    }

    @PatchMapping("/tasks/{id}/status")
    public ResponseEntity<ApiResponse<TaskItem>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        TaskStatus status = TaskStatus.valueOf(body.get("status").toUpperCase());
        TaskItem updated = taskService.updateTaskStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Task updated", updated));
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<ApiResponse<String>> deleteTask(@PathVariable String id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.ok("Task deleted", null));
    }
}

