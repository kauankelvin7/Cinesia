package com.fisioterapia.cinesia.presentation.controller;

import com.fisioterapia.cinesia.application.dto.MateriaDTO;
import com.fisioterapia.cinesia.application.service.MateriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materias")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MateriaController {
    
    private final MateriaService materiaService;
    
    @GetMapping
    public ResponseEntity<List<MateriaDTO>> listarTodas() {
        return ResponseEntity.ok(materiaService.listarTodas());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MateriaDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(materiaService.buscarPorId(id));
    }
    
    @PostMapping
    public ResponseEntity<MateriaDTO> criar(@Valid @RequestBody MateriaDTO materiaDTO) {
        MateriaDTO materiaCriada = materiaService.criar(materiaDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(materiaCriada);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MateriaDTO> atualizar(@PathVariable Long id, @Valid @RequestBody MateriaDTO materiaDTO) {
        return ResponseEntity.ok(materiaService.atualizar(id, materiaDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        materiaService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
