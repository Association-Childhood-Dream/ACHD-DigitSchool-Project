import axios from 'axios'

// Configuration de l'API qui fonctionne en local et sur serveur
const getApiBaseUrl = () => {
  // Utiliser la variable d'environnement si définie
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE
  }
  
  // Détection automatique de l'environnement
  const hostname = window.location.hostname
  const port = window.location.port
  
  // Si on est sur localhost, utiliser le port 6080
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:6080'
  }
  
  // Sur serveur, utiliser le même hostname avec le port 6080
  return `http://${hostname}:6080`
}

const API_BASE_URL = getApiBaseUrl()

// Debug: afficher l'URL de l'API utilisée
console.log('🔗 API Base URL:', API_BASE_URL)

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
