export const getToken = () => localStorage.getItem('theatre_token');
export const getUser = () => {
  const u = localStorage.getItem('theatre_user');
  return u ? JSON.parse(u) : null;
};
export const setAuth = (token: string, user: any) => {
  localStorage.setItem('theatre_token', token);
  localStorage.setItem('theatre_user', JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem('theatre_token');
  localStorage.removeItem('theatre_user');
};
export const isAuthenticated = () => !!getToken();
