package com.fisioterapia.cinesia.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fisioterapia.cinesia.domain.entity.Usuario;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;

/**
 * Serviço para extrair informações do token Firebase JWT
 * IMPORTANTE: Este serviço NÃO valida a assinatura do token.
 * Ele apenas extrai os dados do payload para criar/buscar usuário.
 */
@Service
public class TokenService {
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Extrai usuário do token JWT Firebase
     * @param token Token JWT completo (sem o "Bearer ")
     * @return Usuario com dados extraídos do token (NÃO salvo no banco)
     * @throws Exception se o token for inválido ou mal formatado
     */
    public Usuario extrairUsuario(String token) throws Exception {
        // JWT tem 3 partes separadas por ponto: header.payload.signature
        String[] parts = token.split("\\.");
        
        if (parts.length < 2) {
            throw new IllegalArgumentException("Token JWT inválido (não tem 3 partes)");
        }
        
        // Decodifica o payload (parte 2) de Base64
        String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]));
        
        // Converte JSON para Map
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = objectMapper.readValue(payloadJson, Map.class);
        
        // Extrai informações do payload
        String email = (String) payload.get("email");      // Email do usuário
        String name = (String) payload.get("name");        // Nome (pode ser null)
        
        // Se não tiver nome, usa a parte antes do @ do email
        if (name == null || name.isEmpty()) {
            name = email != null ? email.split("@")[0] : "Usuário";
        }
        
        // Cria objeto Usuario (NÃO PERSISTIDO)
        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setNome(name);
        usuario.setSenhaHash("FIREBASE_AUTH"); // Placeholder
        usuario.setCriadoEm(LocalDateTime.now());
        usuario.setAtualizadoEm(LocalDateTime.now());
        
        return usuario;
    }
}
