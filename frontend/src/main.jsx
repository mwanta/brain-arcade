import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import PlayersPage from './pages/PlayersPage.jsx';
import PlayerDetailPage from './pages/PlayerDetailPage.jsx';
import CreatePlayerPage from './pages/CreatePlayerPage.jsx';
import EditPlayerPage from './pages/EditPlayerPage.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/players" replace />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/new" element={<CreatePlayerPage />} />
          <Route path="/players/:playerId" element={<PlayerDetailPage />} />
          <Route path="/players/:playerId/edit" element={<EditPlayerPage />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
