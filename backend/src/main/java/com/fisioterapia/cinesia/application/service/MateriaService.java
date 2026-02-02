package com.fisioterapia.cinesia.application.service;

import com.fisioterapia.cinesia.application.dto.MateriaDTO;
import com.fisioterapia.cinesia.application.mapper.MateriaMapper;
import com.fisioterapia.cinesia.domain.entity.Materia;
import com.fisioterapia.cinesia.domain.repository.MateriaRepository;
import com.fisioterapia.cinesia.infrastructure.exception.ResourceNotFoundException;
import com.fisioterapia.cinesia.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MateriaService {
    
    private final MateriaRepository materiaRepository;
    private final MateriaMapper materiaMapper;
    
    @Transactional(readOnly = true)
    public List<MateriaDTO> listarTodas() {
        return materiaRepository.findAllByOrderByNomeAsc()
            .stream()
            .map(materiaMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public MateriaDTO buscarPorId(Long id) {
        Materia materia = materiaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + id));
        return materiaMapper.toDTO(materia);
    }
    
    @Transactional
    public MateriaDTO criar(MateriaDTO materiaDTO) {
        if (materiaRepository.existsByNome(materiaDTO.getNome())) {
            throw new BusinessException("Já existe uma matéria com o nome: " + materiaDTO.getNome());
        }
        
        Materia materia = materiaMapper.toEntity(materiaDTO);
        Materia materiaSalva = materiaRepository.save(materia);
        return materiaMapper.toDTO(materiaSalva);
    }
    
    @Transactional
    public MateriaDTO atualizar(Long id, MateriaDTO materiaDTO) {
        Materia materia = materiaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + id));
        
        // Verificar se outro registro já usa o mesmo nome
        if (!materia.getNome().equals(materiaDTO.getNome()) && 
            materiaRepository.existsByNome(materiaDTO.getNome())) {
            throw new BusinessException("Já existe uma matéria com o nome: " + materiaDTO.getNome());
        }
        
        materiaMapper.updateEntity(materiaDTO, materia);
        Materia materiaAtualizada = materiaRepository.save(materia);
        return materiaMapper.toDTO(materiaAtualizada);
    }
    
    @Transactional
    public void deletar(Long id) {
        if (!materiaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Matéria não encontrada com ID: " + id);
        }
        materiaRepository.deleteById(id);
    }
}
