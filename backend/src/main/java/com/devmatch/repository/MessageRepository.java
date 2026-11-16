package com.devmatch.repository;

import com.devmatch.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByConversationIdOrderBySentAtAsc(String conversationId);
    Page<Message> findByConversationIdOrderBySentAtDesc(String conversationId, Pageable pageable);
    long countByConversationIdAndSenderIdNotAndReadFalse(String conversationId, String senderId);
}

