package com.devmatch.repository;

import com.devmatch.model.DeveloperMatch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeveloperMatchRepository extends MongoRepository<DeveloperMatch, String> {
    List<DeveloperMatch> findByProjectIdOrderByTotalScoreDesc(String projectId);
    List<DeveloperMatch> findByDeveloperIdOrderByTotalScoreDesc(String developerId);
    Optional<DeveloperMatch> findByProjectIdAndDeveloperId(String projectId, String developerId);
    void deleteByProjectId(String projectId);
}

