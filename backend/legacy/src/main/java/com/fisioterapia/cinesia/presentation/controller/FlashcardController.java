package com.fisioterapia.cinesia.presentation.controller;

import com.fisioterapia.cinesia.application.dto.FlashcardDTO;
import com.fisioterapia.cinesia.application.service.FlashcardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
public class FlashcardController {
    
    private final FlashcardService flashcardService;
    
    @GetMapping
    public ResponseEntity<List<FlashcardDTO>> listarTodos() {
        return ResponseEntity.ok(flashcardService.listarTodos());
    }
    
    @GetMapping("/materia/{materiaId}")
    public ResponseEntity<List<FlashcardDTO>> listarPorMateria(@PathVariable Long materiaId) {
        return ResponseEntity.ok(flashcardService.listarPorMateria(materiaId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<FlashcardDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(flashcardService.buscarPorId(id));
    }
    
    @GetMapping("/buscar")
    public ResponseEntity<List<FlashcardDTO>> buscar(@RequestParam String texto) {
        return ResponseEntity.ok(flashcardService.buscar(texto));
    }
    
    @PostMapping
    public ResponseEntity<FlashcardDTO> criar(@Valid @RequestBody FlashcardDTO flashcardDTO) {
        FlashcardDTO flashcardCriado = flashcardService.criar(flashcardDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(flashcardCriado);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<FlashcardDTO> atualizar(@PathVariable Long id, @Valid @RequestBody FlashcardDTO flashcardDTO) {
        return ResponseEntity.ok(flashcardService.atualizar(id, flashcardDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        flashcardService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
