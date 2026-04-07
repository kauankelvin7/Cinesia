package com.fisioterapia.cinesia.infrastructure.security;

import com.fisioterapia.cinesia.domain.entity.Usuario;
import com.fisioterapia.cinesia.domain.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * ATENÇÃO: Esta classe DEVE ser um @Component Spring para injetar UsuarioRepository
 * O FirebaseTokenFilter salva currentUserId no request, e aqui buscamos o usuário PERSISTIDO
 */
@Component
public class SecurityUtils {
    
    private static UsuarioRepository usuarioRepository;
    
    @Autowired
    public void setUsuarioRepository(UsuarioRepository usuarioRepository) {
        SecurityUtils.usuarioRepository = usuarioRepository;
    }
    
    /**
     * Retorna o ID do usuário autenticado via Firebase
     * Lê do atributo do request injetado pelo FirebaseTokenFilter
     */
    public static Long getCurrentUserId() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                Object userId = attributes.getRequest().getAttribute("currentUserId");
                if (userId != null) {
                    return (Long) userId;
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️  Erro ao obter currentUserId: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Fallback para usuário ID 1 (desenvolvimento SOMENTE)
        System.err.println("⚠️  AVISO: Usando userId=1 como fallback (desenvolvimento). Token Firebase pode estar ausente.");
        return 1L;
    }
    
    /**
     * Alias para getCurrentUserId() - mantido para compatibilidade
     */
    public static Long getUsuarioIdAutenticado() {
        return getCurrentUserId();
    }
    
    /**
     * CRÍTICO: Retorna o objeto Usuario PERSISTIDO do banco
     * Este método resolve o erro 500 de Foreign Key Constraint
     */
    public static Usuario getUsuarioAutenticado() {
        Long userId = getCurrentUserId();
        
        if (usuarioRepository != null) {
            return usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(
                    "ERRO CRÍTICO: Usuário ID " + userId + " não encontrado no banco. " +
                    "O FirebaseTokenFilter deveria ter criado este usuário automaticamente. " +
                    "Verifique se o token Firebase está correto e se o filtro está ativo."
                ));
        }
        
        // Se o repository não foi injetado (erro de configuração Spring)
        throw new RuntimeException(
            "ERRO DE CONFIGURAÇÃO: UsuarioRepository não foi injetado no SecurityUtils. " +
            "Certifique-se de que SecurityUtils é um @Component."
        );
    }
}
