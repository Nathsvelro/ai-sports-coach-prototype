import React from 'react'

// Input component inspired by Spartan UI design
export function Input({ 
  className = '', 
  type = 'text', 
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  error = false,
  ...props 
}) {
  const baseClasses = `
    flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
    ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
    placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed 
    disabled:opacity-50 transition-colors
  `
  
  const errorClasses = error ? 'border-red-500 focus-visible:ring-red-500' : ''
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  return (
    <input
      type={type}
      className={`${baseClasses} ${errorClasses} ${disabledClasses} ${className}`.trim()}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      {...props}
    />
  )
}

// Textarea component with similar styling
export function Textarea({ 
  className = '', 
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  error = false,
  rows = 3,
  ...props 
}) {
  const baseClasses = `
    flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
    ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none 
    focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
    disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors
  `
  
  const errorClasses = error ? 'border-red-500 focus-visible:ring-red-500' : ''
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  return (
    <textarea
      className={`${baseClasses} ${errorClasses} ${disabledClasses} ${className}`.trim()}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      rows={rows}
      {...props}
    />
  )
}

// Select component with similar styling
export function Select({ 
  className = '', 
  value,
  onChange,
  disabled = false,
  required = false,
  error = false,
  children,
  ...props 
}) {
  const baseClasses = `
    flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
    ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring 
    focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors
  `
  
  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : ''
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  return (
    <select
      className={`${baseClasses} ${errorClasses} ${disabledClasses} ${className}`.trim()}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      {...props}
    >
      {children}
    </select>
  )
}

// Label component for form fields
export function Label({ 
  className = '', 
  children,
  required = false,
  ...props 
}) {
  return (
    <label 
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`.trim()}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

// Form field wrapper component
export function FormField({ 
  label, 
  error, 
  required = false, 
  className = '', 
  children 
}) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
