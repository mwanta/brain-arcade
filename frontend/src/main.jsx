import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import RequireLogin from './components/RequireLogin.jsx';
import { CurrentPlayerProvider } from './context/CurrentPlayerContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DriftGamePage from './pages/DriftGamePage.jsx';
import PlayerStatsPage from './pages/PlayerStatsPage.jsx';
import './styles.css';

// Dev-only visual check for the Drift game. Lazy-loaded behind DEV so the production
// build drops the page, its CSS and the route entirely.
const DriftPreviewPage = import.meta.env.DEV
  ? lazy(() => import('./pages/DriftPreviewPage.jsx'))
  : null;

// The app only ever shows the logged-in player: /login to log in or create a player,
// /stats for their stats. Anything else goes to /stats (or /login when logged out).
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CurrentPlayerProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/stats"
              element={
                <RequireLogin>{(playerId) => <PlayerStatsPage playerId={playerId} />}</RequireLogin>
              }
            />
            {DriftPreviewPage && (
              <Route
                path="/drift/preview"
                element={
                  <Suspense fallback={null}>
                    <DriftPreviewPage />
                  </Suspense>
                }
              />
            )}
            <Route
              path="/drift"
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
