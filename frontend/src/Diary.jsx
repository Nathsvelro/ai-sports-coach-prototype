
import React, { useEffect, useState } from 'react'
import { addGoal, listGoals, addMilestone, addEntry, listEntries } from './api'

export default function Diary() {
  const [goals, setGoals] = useState([])
  const [entries, setEntries] = useState([])
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [mood, setMood] = useState('🙂')
  const [fatigue, setFatigue] = useState(5)
  const [sleep, setSleep] = useState(7)

  async function refresh() { setGoals(await listGoals()); setEntries(await listEntries()) }
  useEffect(() => { refresh() }, [])

  async function onAddGoal(e) { e.preventDefault(); if (!title.trim()) return; await addGoal({ title }); setTitle(''); refresh() }
  async function onAddEntry(e) { e.preventDefault(); await addEntry({ note, mood, fatigue, sleep_hours: Number(sleep) }); setNote(''); refresh() }

  return (
    <div className="space-y-4">
      <form onSubmit={onAddGoal} className="space-y-2">
        <div className="font-semibold">Add Goal</div>
        <div className="flex gap-2">
          <input className="flex-1 border rounded px-3 py-2" placeholder="Run 10K under 50 min" value={title} onChange={e => setTitle(e.target.value)} />
          <button className="px-3 py-2 rounded bg-neutral-900 text-white">Save</button>
        </div>
      </form>

      <form onSubmit={onAddEntry} className="space-y-2">
        <div className="font-semibold">Diary Entry</div>
        <textarea className="w-full border rounded px-3 py-2" rows={3} placeholder="Felt strong in intervals today…" value={note} onChange={e => setNote(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <label className="text-sm">Mood
            <select className="block w-full border rounded px-2 py-1" value={mood} onChange={e => setMood(e.target.value)}>
              <option>🙂</option><option>😐</option><option>😓</option><option>🔥</option>
            </select>
          </label>
          <label className="text-sm">Fatigue (1–10)
            <input type="number" min="1" max="10" className="block w-full border rounded px-2 py-1" value={fatigue} onChange={e => setFatigue(e.target.value)} />
          </label>
          <label className="text-sm">Sleep (h)
            <input type="number" step="0.5" className="block w-full border rounded px-2 py-1" value={sleep} onChange={e => setSleep(e.target.value)} />
          </label>
        </div>
        <button className="px-3 py-2 rounded bg-neutral-900 text-white">Log Entry</button>
      </form>

      <div className="space-y-1">
        <div className="font-semibold">Goals</div>
        <ul className="space-y-1 text-sm">
          {goals.map(g => <li key={g.id} className="border rounded px-3 py-2">{g.title}</li>)}
        </ul>
      </div>

      <div className="space-y-1">
        <div className="font-semibold">Entries</div>
        <ul className="space-y-1 text-sm max-h-48 overflow-auto pr-1">
          {entries.map(en => <li key={en.id} className="border rounded px-3 py-2">
            <div className="text-xs opacity-60">#{en.id}</div>
            <div>{en.note}</div>
            <div className="text-xs opacity-70 mt-1">Mood {en.mood} · Fatigue {en.fatigue ?? '—'} · Sleep {en.sleep_hours ?? '—'}h</div>
          </li>)}
        </ul>
      </div>
    </div>
  )
}
