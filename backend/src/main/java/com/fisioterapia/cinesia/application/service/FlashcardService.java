package com.fisioterapia.cinesia.application.service;

import com.fisioterapia.cinesia.application.dto.FlashcardDTO;
import com.fisioterapia.cinesia.application.mapper.FlashcardMapper;
import com.fisioterapia.cinesia.domain.entity.Flashcard;
import com.fisioterapia.cinesia.domain.entity.Materia;
import com.fisioterapia.cinesia.domain.repository.FlashcardRepository;
import com.fisioterapia.cinesia.domain.repository.MateriaRepository;
import com.fisioterapia.cinesia.infrastructure.exception.ResourceNotFoundException;
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
        return flashcardRepository.findAll()
            .stream()
            .map(flashcardMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<FlashcardDTO> listarPorMateria(Long materiaId) {
        return flashcardRepository.findByMateriaIdOrderByCriadoEmDesc(materiaId)
            .stream()
            .map(flashcardMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public FlashcardDTO buscarPorId(Long id) {
        Flashcard flashcard = flashcardRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Flashcard não encontrado com ID: " + id));
        return flashcardMapper.toDTO(flashcard);
    }
    
    @Transactional(readOnly = true)
    public List<FlashcardDTO> buscar(String texto) {
        return flashcardRepository.findByPerguntaContainingIgnoreCaseOrRespostaContainingIgnoreCase(texto, texto)
            .stream()
            .map(flashcardMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public FlashcardDTO criar(FlashcardDTO flashcardDTO) {
        Materia materia = materiaRepository.findById(flashcardDTO.getMateriaId())
            .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + flashcardDTO.getMateriaId()));
        
        Flashcard flashcard = flashcardMapper.toEntity(flashcardDTO);
        flashcard.setMateria(materia);
        
        Flashcard flashcardSalvo = flashcardRepository.save(flashcard);
        return flashcardMapper.toDTO(flashcardSalvo);
    }
    
    @Transactional
    public FlashcardDTO atualizar(Long id, FlashcardDTO flashcardDTO) {
        Flashcard flashcard = flashcardRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Flashcard não encontrado com ID: " + id));
        
        if (flashcardDTO.getMateriaId() != null && !flashcard.getMateria().getId().equals(flashcardDTO.getMateriaId())) {
            Materia novaMateria = materiaRepository.findById(flashcardDTO.getMateriaId())
                .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + flashcardDTO.getMateriaId()));
            flashcard.setMateria(novaMateria);
        }
        
        flashcardMapper.updateEntity(flashcardDTO, flashcard);
        Flashcard flashcardAtualizado = flashcardRepository.save(flashcard);
        return flashcardMapper.toDTO(flashcardAtualizado);
    }
    
    @Transactional
    public void deletar(Long id) {
        if (!flashcardRepository.existsById(id)) {
            throw new ResourceNotFoundException("Flashcard não encontrado com ID: " + id);
        }
        flashcardRepository.deleteById(id);
    }
}
