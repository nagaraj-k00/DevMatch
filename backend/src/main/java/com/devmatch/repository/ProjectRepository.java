package com.devmatch.repository;

import com.devmatch.model.Project;
import com.devmatch.model.ProjectStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {
    List<Project> findByFounderIdOrderByCreatedAtDesc(String founderId);
    List<Project> findByStatus(ProjectStatus status);
    List<Project> findBySelectedDeveloperId(String developerId);
    List<Project> findByHiredDeveloperId(String developerId);
    List<Project> findByStatusOrderByCreatedAtDesc(ProjectStatus status);
    List<Project> findByStatusAndTitleContainingIgnoreCase(ProjectStatus status, String keyword);
}

