package com.fisioterapia.cinesia.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MateriaDTO {
    
    private Long id;
    
    @NotBlank(message = "Nome da matéria é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    private String nome;
    
    @Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
    private String descricao;
    
    @Size(min = 7, max = 7, message = "Cor deve estar no formato hexadecimal (#RRGGBB)")
    private String cor;
    
    private String criadoEm;
    private String atualizadoEm;
    private Integer totalResumos;
    private Integer totalFlashcards;
}
