package com.fisioterapia.cinesia.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardDTO {
    
    private Long id;
    
    @NotBlank(message = "Pergunta é obrigatória")
    private String pergunta;
    
    @NotBlank(message = "Resposta é obrigatória")
    private String resposta;
    
    private String imagemUrl;
    
    @NotNull(message = "Matéria é obrigatória")
    private Long materiaId;
    
    private String materiaNome;
    private String criadoEm;
    private String atualizadoEm;
}
