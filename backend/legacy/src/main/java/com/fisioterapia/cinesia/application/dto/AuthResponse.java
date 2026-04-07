package com.fisioterapia.cinesia.application.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    private String token;
    private String tipo = "Bearer";
    private Long usuarioId;
    private String nome;
    private String email;
    
    public AuthResponse(String token, Long usuarioId, String nome, String email) {
        this.token = token;
        this.usuarioId = usuarioId;
        this.nome = nome;
        this.email = email;
    }
}
