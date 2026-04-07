package com.fisioterapia.cinesia.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResumoDTO {
    
    private Long id;
    
    @NotBlank(message = "Título é obrigatório")
    @Size(max = 200, message = "Título deve ter no máximo 200 caracteres")
    private String titulo;
    
    private String conteudo; // HTML do editor rico
    
    @NotNull(message = "Matéria é obrigatória")
    private Long materiaId;
    
    private String materiaNome;
    private String criadoEm;
    private String atualizadoEm;
}
