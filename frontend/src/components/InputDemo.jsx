import React, { useState } from 'react'
import { Input, Textarea, Select, FormField } from './Input'

// Demo component to showcase the Spartan UI-inspired input components
export default function InputDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    sport: 'running',
    age: ''
  })

  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center">Spartan UI Input Demo</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name" required error={errors.name}>
          <Input
            placeholder="Enter your name"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={!!errors.name}
          />
        </FormField>

        <FormField label="Email" error={errors.email}>
          <Input
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={!!errors.email}
          />
        </FormField>

        <FormField label="Age">
          <Input
            type="number"
            placeholder="25"
            value={formData.age}
            onChange={(e) => updateField('age', e.target.value)}
            min="1"
            max="120"
          />
        </FormField>

        <FormField label="Preferred Sport">
          <Select 
            value={formData.sport} 
            onChange={(e) => updateField('sport', e.target.value)}
          >
            <option value="running">Running</option>
            <option value="cycling">Cycling</option>
            <option value="swimming">Swimming</option>
            <option value="strength">Strength Training</option>
            <option value="football">Football</option>
            <option value="basketball">Basketball</option>
          </Select>
        </FormField>

        <FormField label="Message" error={errors.message}>
          <Textarea
            placeholder="Tell us about your fitness goals..."
            value={formData.message}
            onChange={(e) => updateField('message', e.target.value)}
            rows={4}
            error={!!errors.message}
          />
        </FormField>

        <div className="flex gap-3">
          <button 
            type="submit"
            className="flex-1 px-4 py-2 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            Submit
          </button>
          <button 
            type="button"
            onClick={() => setFormData({ name: '', email: '', message: '', sport: 'running', age: '' })}
            className="px-4 py-2 rounded-md border border-input hover:bg-muted transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="font-semibold">Component States Demo:</h3>
        
        <FormField label="Disabled Input">
          <Input placeholder="This input is disabled" disabled />
        </FormField>

        <FormField label="Error State" error="This field is required">
          <Input placeholder="Input with error state" error />
        </FormField>

        <FormField label="Focus Ring Demo">
          <Input placeholder="Click me to see the focus ring" />
        </FormField>
      </div>
    </div>
  )
}
