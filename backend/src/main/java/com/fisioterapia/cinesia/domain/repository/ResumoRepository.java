package com.fisioterapia.cinesia.domain.repository;

import com.fisioterapia.cinesia.domain.entity.Resumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumoRepository extends JpaRepository<Resumo, Long> {
    
    List<Resumo> findByMateriaIdOrderByAtualizadoEmDesc(Long materiaId);
    
    List<Resumo> findByTituloContainingIgnoreCase(String titulo);
}
