package com.devmatch.repository;

import com.devmatch.model.DeveloperProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeveloperProfileRepository extends MongoRepository<DeveloperProfile, String> {
    Optional<DeveloperProfile> findByUserId(String userId);
    void deleteByUserId(String userId);
}

