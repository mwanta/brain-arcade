import { request } from './client.js';

export const listUsers = () => request('/users');
export const getUser = (userId) => request(`/users/${userId}`);
export const createUser = (user) => request('/users', { method: 'POST', body: user });
export const updateUser = (userId, changes) =>
  request(`/users/${userId}`, { method: 'PATCH', body: changes });
