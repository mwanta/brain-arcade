import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import UsersPage from './pages/UsersPage.jsx';
import UserDetailPage from './pages/UserDetailPage.jsx';
import CreateUserPage from './pages/CreateUserPage.jsx';
import EditUserPage from './pages/EditUserPage.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/users" replace />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/new" element={<CreateUserPage />} />
          <Route path="/users/:userId" element={<UserDetailPage />} />
          <Route path="/users/:userId/edit" element={<EditUserPage />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
