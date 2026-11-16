package com.devmatch.service;

import com.devmatch.dto.TaskDto;
import com.devmatch.model.TaskItem;
import com.devmatch.model.TaskStatus;
import com.devmatch.repository.TaskItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class TaskService {

    @Autowired
    private TaskItemRepository taskItemRepository;

    public TaskItem createTask(String projectId, TaskDto dto) {
        TaskItem item = new TaskItem();
        item.setProjectId(projectId);
        item.setMilestoneId(dto.getMilestoneId());
        item.setTitle(dto.getTitle());
        item.setDescription(dto.getDescription());
        item.setAssignedTo(dto.getAssignedTo());
        item.setStatus(dto.getStatus() != null ? dto.getStatus() : TaskStatus.TODO);
        item.setDueDate(dto.getDueDate());
        item.setCreatedAt(Instant.now());
        item.setUpdatedAt(Instant.now());
        return taskItemRepository.save(item);
    }

    public TaskItem updateTaskStatus(String taskId, TaskStatus status) {
        TaskItem item = taskItemRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));
        item.setStatus(status);
        item.setUpdatedAt(Instant.now());
        return taskItemRepository.save(item);
    }

    public List<TaskItem> getProjectTasks(String projectId) {
        return taskItemRepository.findByProjectId(projectId);
    }

    public void deleteTask(String taskId) {
        taskItemRepository.deleteById(taskId);
    }
}

