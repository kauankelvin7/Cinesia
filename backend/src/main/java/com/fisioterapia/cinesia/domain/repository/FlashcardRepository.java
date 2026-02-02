package com.fisioterapia.cinesia.domain.repository;

import com.fisioterapia.cinesia.domain.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    
    List<Flashcard> findByUsuarioIdOrderByCriadoEmDesc(Long usuarioId);
    
    List<Flashcard> findByMateriaIdAndUsuarioIdOrderByCriadoEmDesc(Long materiaId, Long usuarioId);
    
    List<Flashcard> findByUsuarioIdAndPerguntaContainingIgnoreCaseOrUsuarioIdAndRespostaContainingIgnoreCase(
        Long usuarioId1, String pergunta, Long usuarioId2, String resposta);
    
    Optional<Flashcard> findByIdAndUsuarioId(Long id, Long usuarioId);
}
