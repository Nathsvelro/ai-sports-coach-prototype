import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

export async function getWebRTCToken() {
  const { data } = await axios.get(`${API_BASE}/api/elevenlabs/webrtc-token`)
  return data.token
}
