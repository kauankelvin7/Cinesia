import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
