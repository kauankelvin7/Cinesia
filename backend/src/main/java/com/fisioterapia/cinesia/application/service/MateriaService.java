package com.fisioterapia.cinesia.application.service;

import com.fisioterapia.cinesia.application.dto.MateriaDTO;
import com.fisioterapia.cinesia.application.mapper.MateriaMapper;
import com.fisioterapia.cinesia.domain.entity.Materia;
import com.fisioterapia.cinesia.domain.entity.Usuario;
import com.fisioterapia.cinesia.domain.repository.MateriaRepository;
import com.fisioterapia.cinesia.infrastructure.exception.ResourceNotFoundException;
import com.fisioterapia.cinesia.infrastructure.exception.BusinessException;
import com.fisioterapia.cinesia.infrastructure.security.SecurityUtils;
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
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        return materiaRepository.findByUsuarioIdOrderByNomeAsc(usuarioId)
            .stream()
            .map(materiaMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public MateriaDTO buscarPorId(Long id) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        Materia materia = materiaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + id));
        return materiaMapper.toDTO(materia);
    }
    
    @Transactional
    public MateriaDTO criar(MateriaDTO materiaDTO) {
        // CRÍTICO: Busca o usuário PERSISTIDO via SecurityUtils
        // O FirebaseTokenFilter já criou/salvou este usuário no banco
        Usuario usuario = SecurityUtils.getUsuarioAutenticado();
        
        // Validação de segurança: Garante que o usuário está persistido
        if (usuario == null || usuario.getId() == null) {
            throw new BusinessException(
                "Usuário não autenticado ou não sincronizado com o banco. " +
                "Certifique-se de enviar o token Firebase no header Authorization."
            );
        }
        
        // Verificação de duplicidade de nome (escopo: por usuário)
        if (materiaRepository.existsByNomeAndUsuarioId(materiaDTO.getNome(), usuario.getId())) {
            throw new BusinessException("Já existe uma matéria com o nome: " + materiaDTO.getNome());
        }
        
        // Cria a matéria vinculada ao usuário PERSISTIDO
        Materia materia = materiaMapper.toEntity(materiaDTO);
        materia.setUsuario(usuario); // Foreign Key será válida (usuario.id existe no banco)
        
        Materia materiaSalva = materiaRepository.save(materia);
        return materiaMapper.toDTO(materiaSalva);
    }
    
    @Transactional
    public MateriaDTO atualizar(Long id, MateriaDTO materiaDTO) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        Materia materia = materiaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + id));
        
        // Verificar se outro registro já usa o mesmo nome
        if (!materia.getNome().equals(materiaDTO.getNome()) && 
            materiaRepository.existsByNomeAndUsuarioId(materiaDTO.getNome(), usuarioId)) {
            throw new BusinessException("Já existe uma matéria com o nome: " + materiaDTO.getNome());
        }
        
        materiaMapper.updateEntity(materiaDTO, materia);
        Materia materiaAtualizada = materiaRepository.save(materia);
        return materiaMapper.toDTO(materiaAtualizada);
    }
    
    @Transactional
    public void deletar(Long id) {
        Long usuarioId = SecurityUtils.getUsuarioIdAutenticado();
        Materia materia = materiaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com ID: " + id));
        materiaRepository.delete(materia);
    }
}
