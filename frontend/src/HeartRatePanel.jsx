
import React, { useState } from 'react'
export default function HeartRatePanel({ onHr }) {
  const [hr, setHr] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  async function connect() {
    setError('')
    try {
      setConnecting(true)
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] })
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('heart_rate')
      const characteristic = await service.getCharacteristic('heart_rate_measurement')
      await characteristic.startNotifications()
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const dv = event.target.value
        const flags = dv.getUint8(0)
        let heartRate = (flags & 0x01) ? dv.getUint16(1, true) : dv.getUint8(1)
        setHr(heartRate); onHr?.(heartRate)
      })
    } catch (e) {
      console.error(e); setError(e.message || 'BLE not available')
    } finally { setConnecting(false) }
  }
  return (
    <div className="p-3 rounded-xl bg-neutral-50 border">
      <div className="font-semibold mb-1">Heart Rate</div>
      <div className="text-2xl">{hr ? `${hr} bpm` : '—'}</div>
      <button onClick={connect} className="mt-2 px-3 py-1 rounded bg-neutral-900 text-white disabled:opacity-50" disabled={connecting}>
        {connecting ? 'Connecting…' : 'Connect BLE'}
      </button>
      {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
    </div>
  )
}
