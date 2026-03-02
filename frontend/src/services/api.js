import axios from 'axios';
import { toast } from 'sonner';
import { auth } from '../config/firebase-config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de requisições
 * Adiciona o token de autenticação do Firebase (JWT) em todas as requisições para proteger rotas privadas.
 * Atualiza o localStorage com o token mais recente.
 * Se não houver usuário autenticado, segue sem token.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // Pega o usuário atual do Firebase
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Pega o token atualizado do Firebase (auto-refresh)
        const token = await currentUser.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
        
        // Atualiza localStorage com token novo
        localStorage.setItem('token', token);
      }
    } catch (error) {
      console.error('Erro ao obter token Firebase:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respostas
 * Lida com erros de rede (ex: servidor offline) e autenticação (401).
 * Exibe toast amigável para o usuário e faz logout automático em caso de 401.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Erro de rede (servidor offline)
    if (error.code === 'ERR_NETWORK' || !error.response) {
      const message = 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
      
      console.error('❌ Erro de Conexão:', message);
      
      toast.error(message);
      
      return Promise.reject({ message, type: 'network' });
    }
    
    // Erro de autenticação
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// ==================== AUTENTICAÇÃO ====================
export const authAPI = {
  login: (email, senha) => api.post('/auth/login', { email, senha }),
  register: (nome, email, senha) => api.post('/auth/register', { nome, email, senha }),
};

// ==================== MATÉRIAS ====================
export const materiasAPI = {
  getAll: () => api.get('/materias'),
  getById: (id) => api.get(`/materias/${id}`),
  create: (data) => api.post('/materias', data),
  update: (id, data) => api.put(`/materias/${id}`, data),
  delete: (id) => api.delete(`/materias/${id}`),
};

// ==================== RESUMOS ====================
export const resumosAPI = {
  getAll: () => api.get('/resumos'),
  getById: (id) => api.get(`/resumos/${id}`),
  getByMateria: (materiaId) => api.get(`/resumos/materia/${materiaId}`),
  search: (titulo) => api.get(`/resumos/buscar?titulo=${titulo}`),
  create: (data) => api.post('/resumos', data),
  update: (id, data) => api.put(`/resumos/${id}`, data),
  delete: (id) => api.delete(`/resumos/${id}`),
};

// ==================== FLASHCARDS ====================
export const flashcardsAPI = {
  getAll: () => api.get('/flashcards'),
  getById: (id) => api.get(`/flashcards/${id}`),
  getByMateria: (materiaId) => api.get(`/flashcards/materia/${materiaId}`),
  search: (texto) => api.get(`/flashcards/buscar?texto=${texto}`),
  create: (data) => api.post('/flashcards', data),
  update: (id, data) => api.put(`/flashcards/${id}`, data),
  delete: (id) => api.delete(`/flashcards/${id}`),
};

// ==================== UPLOAD DE IMAGENS ====================
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/imagem', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteImage: (filename) => api.delete(`/upload/imagem/${filename}`),
  getImageUrl: (filename) => `${API_URL}/upload/imagem/${filename}`,
};

export default api;
