import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000/api', timeout: 15000 })
export async function logout(){ try{ await api.post('/auth/logout') }catch(e){} localStorage.removeItem('token') }
