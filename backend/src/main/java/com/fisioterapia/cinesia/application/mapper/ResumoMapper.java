package com.fisioterapia.cinesia.application.mapper;

import com.fisioterapia.cinesia.application.dto.ResumoDTO;
import com.fisioterapia.cinesia.domain.entity.Resumo;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
public class ResumoMapper {
    
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    
    public ResumoDTO toDTO(Resumo resumo) {
        if (resumo == null) {
            return null;
        }
        
        ResumoDTO dto = new ResumoDTO();
        dto.setId(resumo.getId());
        dto.setTitulo(resumo.getTitulo());
        dto.setConteudo(resumo.getConteudo());
        dto.setMateriaId(resumo.getMateria() != null ? resumo.getMateria().getId() : null);
        dto.setMateriaNome(resumo.getMateria() != null ? resumo.getMateria().getNome() : null);
        dto.setCriadoEm(resumo.getCriadoEm() != null ? resumo.getCriadoEm().format(formatter) : null);
        dto.setAtualizadoEm(resumo.getAtualizadoEm() != null ? resumo.getAtualizadoEm().format(formatter) : null);
        
        return dto;
    }
    
    public Resumo toEntity(ResumoDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Resumo resumo = new Resumo();
        resumo.setId(dto.getId());
        resumo.setTitulo(dto.getTitulo());
        resumo.setConteudo(dto.getConteudo());
        
        return resumo;
    }
    
    public void updateEntity(ResumoDTO dto, Resumo resumo) {
        resumo.setTitulo(dto.getTitulo());
        resumo.setConteudo(dto.getConteudo());
    }
}
