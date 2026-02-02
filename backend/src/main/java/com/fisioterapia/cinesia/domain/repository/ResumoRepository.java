package com.fisioterapia.cinesia.domain.repository;

import com.fisioterapia.cinesia.domain.entity.Resumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumoRepository extends JpaRepository<Resumo, Long> {
    
    List<Resumo> findByUsuarioIdOrderByAtualizadoEmDesc(Long usuarioId);
    
    List<Resumo> findByMateriaIdAndUsuarioIdOrderByAtualizadoEmDesc(Long materiaId, Long usuarioId);
    
    List<Resumo> findByTituloContainingIgnoreCaseAndUsuarioId(String titulo, Long usuarioId);
    
    Optional<Resumo> findByIdAndUsuarioId(Long id, Long usuarioId);
}
