package com.fisioterapia.cinesia.application.mapper;

import com.fisioterapia.cinesia.application.dto.MateriaDTO;
import com.fisioterapia.cinesia.domain.entity.Materia;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
public class MateriaMapper {
    
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    
    public MateriaDTO toDTO(Materia materia) {
        if (materia == null) {
            return null;
        }
        
        MateriaDTO dto = new MateriaDTO();
        dto.setId(materia.getId());
        dto.setNome(materia.getNome());
        dto.setDescricao(materia.getDescricao());
        dto.setCor(materia.getCor());
        dto.setCriadoEm(materia.getCriadoEm() != null ? materia.getCriadoEm().format(formatter) : null);
        dto.setAtualizadoEm(materia.getAtualizadoEm() != null ? materia.getAtualizadoEm().format(formatter) : null);
        dto.setTotalResumos(materia.getResumos() != null ? materia.getResumos().size() : 0);
        dto.setTotalFlashcards(materia.getFlashcards() != null ? materia.getFlashcards().size() : 0);
        
        return dto;
    }
    
    public Materia toEntity(MateriaDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Materia materia = new Materia();
        materia.setId(dto.getId());
        materia.setNome(dto.getNome());
        materia.setDescricao(dto.getDescricao());
        materia.setCor(dto.getCor());
        
        return materia;
    }
    
    public void updateEntity(MateriaDTO dto, Materia materia) {
        materia.setNome(dto.getNome());
        materia.setDescricao(dto.getDescricao());
        materia.setCor(dto.getCor());
    }
}
