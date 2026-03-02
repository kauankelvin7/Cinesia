package com.fisioterapia.cinesia.presentation.controller;

import com.fisioterapia.cinesia.application.dto.ResumoDTO;
import com.fisioterapia.cinesia.application.service.ResumoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resumos")
@RequiredArgsConstructor
public class ResumoController {
    
    private final ResumoService resumoService;
    
    @GetMapping
    public ResponseEntity<List<ResumoDTO>> listarTodos() {
        return ResponseEntity.ok(resumoService.listarTodos());
    }
    
    @GetMapping("/materia/{materiaId}")
    public ResponseEntity<List<ResumoDTO>> listarPorMateria(@PathVariable Long materiaId) {
        return ResponseEntity.ok(resumoService.listarPorMateria(materiaId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ResumoDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(resumoService.buscarPorId(id));
    }
    
    @GetMapping("/buscar")
    public ResponseEntity<List<ResumoDTO>> buscarPorTitulo(@RequestParam String titulo) {
        return ResponseEntity.ok(resumoService.buscarPorTitulo(titulo));
    }
    
    @PostMapping
    public ResponseEntity<ResumoDTO> criar(@Valid @RequestBody ResumoDTO resumoDTO) {
        ResumoDTO resumoCriado = resumoService.criar(resumoDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(resumoCriado);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ResumoDTO> atualizar(@PathVariable Long id, @Valid @RequestBody ResumoDTO resumoDTO) {
        return ResponseEntity.ok(resumoService.atualizar(id, resumoDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        resumoService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
