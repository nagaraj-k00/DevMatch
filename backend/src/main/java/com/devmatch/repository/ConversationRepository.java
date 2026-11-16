package com.devmatch.repository;

import com.devmatch.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    Optional<Conversation> findByProjectIdAndDeveloperId(String projectId, String developerId);
    List<Conversation> findByFounderIdOrderByLastMessageAtDesc(String founderId);
    List<Conversation> findByDeveloperIdOrderByLastMessageAtDesc(String developerId);
    List<Conversation> findByProjectId(String projectId);
}

