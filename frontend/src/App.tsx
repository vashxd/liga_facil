import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTeam from './pages/CreateTeam';
import EditTeam from './pages/EditTeam';
import CreateChampionship from './pages/CreateChampionship';
import ManageChampionship from './pages/ManageChampionship';
import Teams from './pages/Teams';
import TeamDetails from './pages/TeamDetails';
import Championships from './pages/Championships';
import ChampionshipDetails from './pages/ChampionshipDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rotas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/teams" element={
            <ProtectedRoute>
              <Teams />
            </ProtectedRoute>
          } />

          <Route path="/teams/new" element={
            <ProtectedRoute>
              <CreateTeam />
            </ProtectedRoute>
          } />

          <Route path="/teams/:id" element={
            <ProtectedRoute>
              <TeamDetails />
            </ProtectedRoute>
          } />

          <Route path="/teams/:id/edit" element={
            <ProtectedRoute>
              <EditTeam />
            </ProtectedRoute>
          } />

          <Route path="/championships" element={
            <ProtectedRoute>
              <Championships />
            </ProtectedRoute>
          } />

          <Route path="/championships/new" element={
            <ProtectedRoute>
              <CreateChampionship />
            </ProtectedRoute>
          } />

          <Route path="/championships/:id" element={
            <ProtectedRoute>
              <ChampionshipDetails />
            </ProtectedRoute>
          } />

          <Route path="/championships/:id/manage" element={
            <ProtectedRoute>
              <ManageChampionship />
            </ProtectedRoute>
          } />

          {/* Outras rotas protegidas serão adicionadas aqui */}

          {/* Redirecionamento padrão */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
