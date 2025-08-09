
import axios from 'axios'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
export async function getWebRTCToken() {
  const { data } = await axios.get(`${API_BASE}/api/elevenlabs/webrtc-token`)
  return data.token
}
export async function getExerciseSuggestions({ lat, lon, city, sport }) {
  const { data } = await axios.get(`${API_BASE}/api/suggest/exercises`, { params: { lat, lon, city, sport } })
  return data
}
export async function addGoal(payload) { const { data } = await axios.post(`${API_BASE}/api/diary/goals`, payload); return data }
export async function listGoals() { const { data } = await axios.get(`${API_BASE}/api/diary/goals`); return data }
export async function addMilestone(payload) { const { data } = await axios.post(`${API_BASE}/api/diary/milestones`, payload); return data }
export async function addEntry(payload) { const { data } = await axios.post(`${API_BASE}/api/diary/entries`, payload); return data }
export async function listEntries() { const { data } = await axios.get(`${API_BASE}/api/diary/entries`); return data }
