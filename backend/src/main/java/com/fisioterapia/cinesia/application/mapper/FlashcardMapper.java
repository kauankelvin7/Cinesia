package com.fisioterapia.cinesia.application.mapper;

import com.fisioterapia.cinesia.application.dto.FlashcardDTO;
import com.fisioterapia.cinesia.domain.entity.Flashcard;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
public class FlashcardMapper {
    
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    
    public FlashcardDTO toDTO(Flashcard flashcard) {
        if (flashcard == null) {
            return null;
        }
        
        FlashcardDTO dto = new FlashcardDTO();
        dto.setId(flashcard.getId());
        dto.setPergunta(flashcard.getPergunta());
        dto.setResposta(flashcard.getResposta());
        dto.setImagemUrl(flashcard.getImagemUrl());
        dto.setMateriaId(flashcard.getMateria() != null ? flashcard.getMateria().getId() : null);
        dto.setMateriaNome(flashcard.getMateria() != null ? flashcard.getMateria().getNome() : null);
        dto.setCriadoEm(flashcard.getCriadoEm() != null ? flashcard.getCriadoEm().format(formatter) : null);
        dto.setAtualizadoEm(flashcard.getAtualizadoEm() != null ? flashcard.getAtualizadoEm().format(formatter) : null);
        
        return dto;
    }
    
    public Flashcard toEntity(FlashcardDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Flashcard flashcard = new Flashcard();
        flashcard.setId(dto.getId());
        flashcard.setPergunta(dto.getPergunta());
        flashcard.setResposta(dto.getResposta());
        flashcard.setImagemUrl(dto.getImagemUrl());
        
        return flashcard;
    }
    
    public void updateEntity(FlashcardDTO dto, Flashcard flashcard) {
        flashcard.setPergunta(dto.getPergunta());
        flashcard.setResposta(dto.getResposta());
        flashcard.setImagemUrl(dto.getImagemUrl());
    }
}
