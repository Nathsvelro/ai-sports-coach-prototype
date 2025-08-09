
import React, { useState } from 'react'
import { getExerciseSuggestions } from './api'
import { Input, Select, FormField } from './components/Input'

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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="City (events)">
          <Input 
            value={city} 
            onChange={e => setCity(e.target.value)} 
            placeholder="Mexico City"
          />
        </FormField>
        
        <FormField label="Sport">
          <Select value={sport} onChange={e => setSport(e.target.value)}>
            <option>running</option>
            <option>cycling</option>
            <option>strength</option>
            <option>football</option>
          </Select>
        </FormField>
      </div>
      
      <button 
        onClick={runSuggest} 
        disabled={loading}
        className="px-4 py-2 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Thinking…' : 'Suggest Plan'}
      </button>
      
      {error && <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md border border-red-200">{error}</div>}
      {recommendations && (
        <pre className="whitespace-pre-wrap text-sm border rounded-md p-3 bg-muted">{recommendations}</pre>
      )}
    </div>
  )
}
