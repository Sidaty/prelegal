package com.prelegal.document;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Persistence access for {@link SavedDocument}, always scoped to the owner's email. */
public interface SavedDocumentRepository extends JpaRepository<SavedDocument, Long> {

    List<SavedDocument> findByOwnerEmailOrderByUpdatedAtDesc(String email);

    Optional<SavedDocument> findByIdAndOwnerEmail(Long id, String email);
}
