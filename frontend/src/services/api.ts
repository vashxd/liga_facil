import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Interfaces
export interface User {
  id: number;
  nome: string;
  email: string;
  dataCadastro: string;
}

export interface Team {
  id: number;
  nome: string;
  escudo?: string;
  dataCriacao: string;
  criador: User;
  jogadores: Player[];
}

export interface Player {
  id: number;
  nome: string;
  posicao: string;
  numero: number;
  timeId: number;
}

export interface Championship {
  id: number;
  nome: string;
  formato: string;
  dataInicio: string;
  privado: boolean;
  organizador: User;
  inscricoes?: any[];
  partidas?: any[];
  classificacoes?: any[];
}

// Serviços de autenticação
export const authService = {
  async register(userData: { nome: string; email: string; senha: string }) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials: { email: string; senha: string }) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async verifyToken() {
    const response = await api.get('/auth/verify');
    return response.data;
  },
};

// Serviços de usuário
export const userService = {
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async updateProfile(userData: { nome: string }) {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
};

// Serviços de times
export const teamService = {
  async getUserTeams() {
    const response = await api.get('/teams');
    return response.data;
  },

  async getTeamById(id: number) {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  async createTeam(teamData: { nome: string; escudo?: string }) {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  async updateTeam(id: number, teamData: { nome?: string; escudo?: string }) {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.data;
  },

  async addPlayer(teamId: number, playerData: { nome: string; posicao: string; numero: number }) {
    const response = await api.post(`/teams/${teamId}/players`, playerData);
    return response.data;
  },

  async removePlayer(teamId: number, playerId: number) {
    const response = await api.delete(`/teams/${teamId}/players/${playerId}`);
    return response.data;
  },
};

// Serviços de campeonatos
export const championshipService = {
  async getPublicChampionships(params?: {
    page?: number;
    limit?: number;
    formato?: string;
    search?: string;
    dataInicio?: string;
    dataFim?: string;
    status?: string;
    organizador?: string;
  }) {
    const response = await api.get('/championships/public', { params });
    return response.data;
  },

  async getUserChampionships() {
    const response = await api.get('/championships');
    return response.data;
  },

  async getChampionshipById(id: number) {
    const response = await api.get(`/championships/${id}`);
    return response.data;
  },

  async getChampionshipByCode(code: string) {
    const response = await api.get(`/championships/code/${code}`);
    return response.data;
  },

  async createChampionship(championshipData: {
    nome: string;
    formato: string;
    dataInicio: string;
    privado?: boolean;
  }) {
    const response = await api.post('/championships', championshipData);
    return response.data;
  },

  async updateChampionship(id: number, championshipData: any) {
    const response = await api.put(`/championships/${id}`, championshipData);
    return response.data;
  },

  async enrollTeam(championshipId: number, timeId: number) {
    const response = await api.post(`/championships/${championshipId}/enroll`, { timeId });
    return response.data;
  },

  async generateMatches(championshipId: number) {
    const response = await api.post(`/championships/${championshipId}/generate-matches`);
    return response.data;
  },

  async getChampionshipStandings(championshipId: number) {
    const response = await api.get(`/championships/${championshipId}/standings`);
    return response.data;
  },

  async deleteChampionship(championshipId: number) {
    const response = await api.delete(`/championships/${championshipId}`);
    return response.data;
  },

  async getChampionshipEnrollments(championshipId: number) {
    const response = await api.get(`/championships/${championshipId}/enrollments`);
    return response.data;
  },

  async removeTeamFromChampionship(championshipId: number, teamId: number) {
    const response = await api.delete(`/championships/${championshipId}/teams/${teamId}`);
    return response.data;
  },
};

// Serviços de partidas
export const matchService = {
  async getMatchesByChampionship(championshipId: number) {
    const response = await api.get(`/matches/championship/${championshipId}`);
    return response.data;
  },

  async getMatchById(matchId: number) {
    const response = await api.get(`/matches/${matchId}`);
    return response.data;
  },

  async createMatch(matchData: any) {
    const response = await api.post('/matches', matchData);
    return response.data;
  },

  async updateMatchResult(matchId: number, resultData: { golsTimeCasa: number; golsTimeVisitante: number; observacoes?: string }) {
    const response = await api.put(`/matches/${matchId}/result`, resultData);
    return response.data;
  },

  async updateMatchStatus(matchId: number, status: string) {
    const response = await api.put(`/matches/${matchId}/status`, { status });
    return response.data;
  },

  async updateMatchDateTime(matchId: number, dataHora: string) {
    const response = await api.put(`/matches/${matchId}/datetime`, { dataHora });
    return response.data;
  },
};

// Serviços de notificações
export const notificationService = {
  async getNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  async markAsRead(notificationId: number) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};

// Serviços de escalação
export const lineupService = {
  async createOrUpdateLineup(lineupData: {
    partidaId: number;
    timeId: number;
    formacao: string;
    titulares: { jogadorId: number }[];
    reservas: { jogadorId: number }[];
  }) {
    const response = await api.post('/lineups', lineupData);
    return response.data;
  },

  async getLineup(partidaId: number, timeId: number) {
    const response = await api.get(`/lineups/${partidaId}/${timeId}`);
    return response.data;
  },

  async getMatchLineups(partidaId: number) {
    const response = await api.get(`/lineups/match/${partidaId}`);
    return response.data;
  },

  async deleteLineup(partidaId: number, timeId: number) {
    const response = await api.delete(`/lineups/${partidaId}/${timeId}`);
    return response.data;
  },
};

export default api;