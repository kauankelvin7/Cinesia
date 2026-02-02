package com.fisioterapia.cinesia.domain.repository;

import com.fisioterapia.cinesia.domain.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    
    List<Flashcard> findByMateriaIdOrderByCriadoEmDesc(Long materiaId);
    
    List<Flashcard> findByPerguntaContainingIgnoreCaseOrRespostaContainingIgnoreCase(
        String pergunta, String resposta);
}
