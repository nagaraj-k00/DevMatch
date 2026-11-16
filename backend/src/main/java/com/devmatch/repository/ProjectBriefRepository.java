package com.devmatch.repository;

import com.devmatch.model.ProjectBrief;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectBriefRepository extends MongoRepository<ProjectBrief, String> {
    Optional<ProjectBrief> findByProjectId(String projectId);
    void deleteByProjectId(String projectId);
}

