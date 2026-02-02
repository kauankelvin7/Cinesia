package com.fisioterapia.cinesia.application.service;

import com.fisioterapia.cinesia.application.dto.ResumoDTO;
import com.fisioterapia.cinesia.application.mapper.ResumoMapper;
import com.fisioterapia.cinesia.domain.entity.Materia;
import com.fisioterapia.cinesia.domain.entity.Resumo;
import com.fisioterapia.cinesia.domain.repository.MateriaRepository;
import com.fisioterapia.cinesia.domain.repository.ResumoRepository;
import com.fisioterapia.cinesia.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResumoService {
    
    private final ResumoRepository resumoRepository;
    private final MateriaRepository materiaRepository;
    private final ResumoMapper resumoMapper;
    
    @Transactional(readOnly = true)
    public List<ResumoDTO> listarTodos() {
        return resumoRepository.findAll()
            .stream()
            .map(resumoMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ResumoDTO> listarPorMateria(Long materiaId) {
        return resumoRepository.findByMateriaIdOrderByAtualizadoEmDesc(materiaId)
            .stream()
            .map(resumoMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ResumoDTO buscarPorId(Long id) {
        Resumo resumo = resumoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Resumo não encontrado com ID: " + id));
        return resumoMapper.toDTO(resumo);
    }
    
    @Transactional(readOnly = true)
    public List<ResumoDTO> buscarPorTitulo(String titulo) {
        return resumoRepository.findByTituloContainingIgnoreCase(titulo)
            .stream()
            .map(resumoMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public ResumoDTO criar(ResumoDTO resumoDTO) {
        Materia materia = materiaRepository.findById(resumoDTO.getMateriaId())
            .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + resumoDTO.getMateriaId()));
        
        Resumo resumo = resumoMapper.toEntity(resumoDTO);
        resumo.setMateria(materia);
        
        Resumo resumoSalvo = resumoRepository.save(resumo);
        return resumoMapper.toDTO(resumoSalvo);
    }
    
    @Transactional
    public ResumoDTO atualizar(Long id, ResumoDTO resumoDTO) {
        Resumo resumo = resumoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Resumo não encontrado com ID: " + id));
        
        if (resumoDTO.getMateriaId() != null && !resumo.getMateria().getId().equals(resumoDTO.getMateriaId())) {
            Materia novaMateria = materiaRepository.findById(resumoDTO.getMateriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + resumoDTO.getMateriaId()));
            resumo.setMateria(novaMateria);
        }
        
        resumoMapper.updateEntity(resumoDTO, resumo);
        Resumo resumoAtualizado = resumoRepository.save(resumo);
        return resumoMapper.toDTO(resumoAtualizado);
    }
    
    @Transactional
    public void deletar(Long id) {
        if (!resumoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resumo não encontrado com ID: " + id);
        }
        resumoRepository.deleteById(id);
    }
}
