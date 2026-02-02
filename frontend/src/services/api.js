import axios from 'axios';
import { auth } from '../config/firebase-config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar Firebase ID Token em todas as requisições
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

// Interceptor para tratar erros de autenticação e conexão
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Erro de rede (servidor offline)
    if (error.code === 'ERR_NETWORK' || !error.response) {
      const message = 'Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.';
      
      // Toast simples via console (você pode substituir por uma lib como react-toastify)
      console.error('❌ Erro de Conexão:', message);
      
      // Alerta visual simples
      if (typeof window !== 'undefined') {
        // Cria um toast customizado se não houver biblioteca
        showToast(message, 'error');
      }
      
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

// Função auxiliar para toast simples (pode ser substituída por react-toastify)
const showToast = (message, type = 'info') => {
  // Remove toasts anteriores
  const existingToast = document.getElementById('api-toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.id = 'api-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#FEE2E2' : '#E0F2FE'};
    color: ${type === 'error' ? '#991B1B' : '#075985'};
    border: 1px solid ${type === 'error' ? '#FCA5A5' : '#BAE6FD'};
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    max-width: 400px;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Remove após 5 segundos
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
  
  // Adiciona animações CSS
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
};

// Auth
export const authAPI = {
  login: (email, senha) => api.post('/auth/login', { email, senha }),
  register: (nome, email, senha) => api.post('/auth/register', { nome, email, senha }),
};

// Matérias
export const materiasAPI = {
  getAll: () => api.get('/materias'),
  getById: (id) => api.get(`/materias/${id}`),
  create: (data) => api.post('/materias', data),
  update: (id, data) => api.put(`/materias/${id}`, data),
  delete: (id) => api.delete(`/materias/${id}`),
};

// Resumos
export const resumosAPI = {
  getAll: () => api.get('/resumos'),
  getById: (id) => api.get(`/resumos/${id}`),
  getByMateria: (materiaId) => api.get(`/resumos/materia/${materiaId}`),
  search: (titulo) => api.get(`/resumos/buscar?titulo=${titulo}`),
  create: (data) => api.post('/resumos', data),
  update: (id, data) => api.put(`/resumos/${id}`, data),
  delete: (id) => api.delete(`/resumos/${id}`),
};

// Flashcards
export const flashcardsAPI = {
  getAll: () => api.get('/flashcards'),
  getById: (id) => api.get(`/flashcards/${id}`),
  getByMateria: (materiaId) => api.get(`/flashcards/materia/${materiaId}`),
  search: (texto) => api.get(`/flashcards/buscar?texto=${texto}`),
  create: (data) => api.post('/flashcards', data),
  update: (id, data) => api.put(`/flashcards/${id}`, data),
  delete: (id) => api.delete(`/flashcards/${id}`),
};

// Upload de imagens
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
