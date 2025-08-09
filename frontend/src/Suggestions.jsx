
import React, { useState } from 'react'
import { getExerciseSuggestions } from './api'

export default function Suggestions() {
  const [city, setCity] = useState('Mexico City')
  const [sport, setSport] = useState('running')
  const [recommendations, setRecommendations] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runSuggest() {
    setError(''); setLoading(true)
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
      })
      const { latitude: lat, longitude: lon } = pos.coords
      const data = await getExerciseSuggestions({ lat, lon, city, sport })
      setRecommendations(data.recommendations)
    } catch (e) { setError(e.message || 'Failed to get suggestions') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">City (events)
          <input className="w-full border rounded px-3 py-2" value={city} onChange={e => setCity(e.target.value)} />
        </label>
        <label className="text-sm">Sport
          <select className="w-full border rounded px-3 py-2" value={sport} onChange={e => setSport(e.target.value)}>
            <option>running</option><option>cycling</option><option>strength</option><option>football</option>
          </select>
        </label>
      </div>
      <button onClick={runSuggest} className="px-3 py-2 rounded bg-neutral-900 text-white">{loading ? 'Thinking…' : 'Suggest Plan'}</button>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {recommendations && (<pre className="whitespace-pre-wrap text-sm border rounded p-2 bg-neutral-50">{recommendations}</pre>)}
    </div>
  )
}
