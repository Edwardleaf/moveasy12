import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000/api', timeout: 15000 })
export async function listBuildings(){ const {data}=await api.get('/buildings'); return data||[] }
export async function createBuilding(payload){ const {data}=await api.post('/buildings', payload); return data }
export async function updateBuilding(id,payload){ const {data}=await api.put(`/buildings/${id}`, payload); return data }
export async function deleteBuilding(id){ const {data}=await api.delete(`/buildings/${id}`); return data }
export async function uploadFile(file){ const form=new FormData(); form.append('file', file); const {data}=await api.post('/upload', form); return data }
