import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import RequireLogin from './components/RequireLogin.jsx';
import { CurrentPlayerProvider } from './context/CurrentPlayerContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DriftGamePage from './pages/DriftGamePage.jsx';
import PlayerStatsPage from './pages/PlayerStatsPage.jsx';
import QuickMatchPage from './pages/QuickMatchPage.jsx';
import './styles.css';

// Gameplay and stats use the logged-in player held by CurrentPlayerProvider.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CurrentPlayerProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/games/quick-match"
              element={
                <RequireLogin>{(playerId) => <QuickMatchPage playerId={playerId} />}</RequireLogin>
              }
            />
            <Route
              path="/stats"
              element={
                <RequireLogin>{(playerId) => <PlayerStatsPage playerId={playerId} />}</RequireLogin>
              }
            />
            <Route
              path="/drift/*"
              element={
                <RequireLogin>{(playerId) => <DriftGamePage playerId={playerId} />}</RequireLogin>
              }
            />
            <Route path="*" element={<Navigate to="/stats" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CurrentPlayerProvider>
  </React.StrictMode>
);
