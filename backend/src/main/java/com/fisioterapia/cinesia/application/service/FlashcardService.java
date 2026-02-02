package com.fisioterapia.cinesia.application.service;

import com.fisioterapia.cinesia.application.dto.FlashcardDTO;
import com.fisioterapia.cinesia.application.mapper.FlashcardMapper;
import com.fisioterapia.cinesia.domain.entity.Flashcard;
import com.fisioterapia.cinesia.domain.entity.Materia;
import com.fisioterapia.cinesia.domain.entity.Usuario;
import com.fisioterapia.cinesia.domain.repository.FlashcardRepository;
import com.fisioterapia.cinesia.domain.repository.MateriaRepository;
import com.fisioterapia.cinesia.infrastructure.exception.ResourceNotFoundException;
import com.fisioterapia.cinesia.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlashcardService {
    
    private final FlashcardRepository flashcardRepository;
    private final MateriaRepository materiaRepository;
    private final FlashcardMapper flashcardMapper;
    
    @Transactional(readOnly = true)
    public List<FlashcardDTO> listarTodos() {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        return flashcardRepository.findByUsuarioIdOrderByCriadoEmDesc(usuarioId)
            .stream()
            .map(flashcardMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<FlashcardDTO> listarPorMateria(Long materiaId) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        return flashcardRepository.findByMateriaIdAndUsuarioIdOrderByCriadoEmDesc(materiaId, usuarioId)
            .stream()
            .map(flashcardMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public FlashcardDTO buscarPorId(Long id) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        Flashcard flashcard = flashcardRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Flashcard não encontrado com ID: " + id));
        return flashcardMapper.toDTO(flashcard);
    }
    
    @Transactional(readOnly = true)
    public List<FlashcardDTO> buscar(String texto) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        return flashcardRepository.findByUsuarioIdAndPerguntaContainingIgnoreCaseOrUsuarioIdAndRespostaContainingIgnoreCase(
                usuarioId, texto, usuarioId, texto)
            .stream()
            .map(flashcardMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public FlashcardDTO criar(FlashcardDTO flashcardDTO) {
        Usuario usuario = SecurityUtils.getUsuarioAutenticado();
        Long usuarioId = usuario.getId();
        
        Materia materia = materiaRepository.findByIdAndUsuarioId(flashcardDTO.getMateriaId(), usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + flashcardDTO.getMateriaId()));
        
        Flashcard flashcard = flashcardMapper.toEntity(flashcardDTO);
        flashcard.setMateria(materia);
        flashcard.setUsuario(usuario);
        
        Flashcard flashcardSalvo = flashcardRepository.save(flashcard);
        return flashcardMapper.toDTO(flashcardSalvo);
    }
    
    @Transactional
    public FlashcardDTO atualizar(Long id, FlashcardDTO flashcardDTO) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        Flashcard flashcard = flashcardRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Flashcard não encontrado com ID: " + id));
        
        if (flashcardDTO.getMateriaId() != null && !flashcard.getMateria().getId().equals(flashcardDTO.getMateriaId())) {
            Materia novaMateria = materiaRepository.findByIdAndUsuarioId(flashcardDTO.getMateriaId(), usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + flashcardDTO.getMateriaId()));
            flashcard.setMateria(novaMateria);
        }
        
        flashcardMapper.updateEntity(flashcardDTO, flashcard);
        Flashcard flashcardAtualizado = flashcardRepository.save(flashcard);
        return flashcardMapper.toDTO(flashcardAtualizado);
    }
    
    @Transactional
    public void deletar(Long id) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        Flashcard flashcard = flashcardRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Flashcard não encontrado com ID: " + id));
        flashcardRepository.delete(flashcard);
    }
}
