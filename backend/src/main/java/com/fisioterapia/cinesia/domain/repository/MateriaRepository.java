package com.fisioterapia.cinesia.domain.repository;

import com.fisioterapia.cinesia.domain.entity.Materia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MateriaRepository extends JpaRepository<Materia, Long> {
    
    List<Materia> findAllByOrderByNomeAsc();
    
    Optional<Materia> findByNome(String nome);
    
    boolean existsByNome(String nome);
}
