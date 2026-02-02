package com.fisioterapia.cinesia.infrastructure.security;

import com.fisioterapia.cinesia.domain.entity.Usuario;
import com.fisioterapia.cinesia.domain.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

/**
 * Filtro ROBUSTO que intercepta requisições com token Firebase
 * Versão simplificada: Extrai dados do token SEM validar assinatura
 * Implementa "Silent Registration" - cria usuário automaticamente se não existir
 * 
 * IMPORTANTE: Se houver erro no token, deixa passar como anônimo (não bloqueia a requisição)
 */
@Component
public class FirebaseTokenFilter extends OncePerRequestFilter {

    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private TokenService tokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // 1️⃣ Pega o header Authorization
            String authHeader = request.getHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                // 2️⃣ Extrai usuário do token (usando TokenService)
                Usuario usuarioDoToken = tokenService.extrairUsuario(token);
                String email = usuarioDoToken.getEmail();

                // 3️⃣ Busca no banco por email
                Usuario usuarioDoBanco = usuarioRepository.findByEmail(email).orElse(null);

                // 4️⃣ Se não existir, cria (SILENT REGISTRATION)
                if (usuarioDoBanco == null) {
                    usuarioDoBanco = usuarioRepository.save(usuarioDoToken);
                    System.out.println("✅ SILENT REGISTRATION: Novo usuário criado via Firebase: " + email + " (ID: " + usuarioDoBanco.getId() + ")");
                } else {
                    System.out.println("✅ Usuário existente autenticado: " + email + " (ID: " + usuarioDoBanco.getId() + ")");
                }

                // 5️⃣ Injeta usuário no SecurityContext
                UserDetails userDetails = User.builder()
                        .username(usuarioDoBanco.getId().toString())
                        .password("")
                        .authorities(new ArrayList<>())
                        .build();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(authentication);

                // 6️⃣ Armazena ID do usuário no request (para uso posterior)
                request.setAttribute("currentUserId", usuarioDoBanco.getId());
            }
        } catch (Exception e) {
            // ⚠️ ERRO NO TOKEN: Apenas loga, mas NÃO bloqueia a requisição
            // O Controller vai retornar 401 se precisar de autenticação
            System.err.println("⚠️ Erro ao processar token Firebase (requisição continua como anônimo): " + e.getMessage());
        }

        // 7️⃣ Continua a cadeia de filtros (SEMPRE, mesmo com erro)
        filterChain.doFilter(request, response);
    }
}
