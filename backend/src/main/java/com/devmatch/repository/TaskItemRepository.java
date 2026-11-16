package com.devmatch.repository;

import com.devmatch.model.TaskItem;
import com.devmatch.model.TaskStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskItemRepository extends MongoRepository<TaskItem, String> {
    List<TaskItem> findByProjectId(String projectId);
    List<TaskItem> findByProjectIdAndStatus(String projectId, TaskStatus status);
    List<TaskItem> findByMilestoneId(String milestoneId);
}

