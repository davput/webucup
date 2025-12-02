import { useState, useEffect } from 'react'

export default function CurrencyInput({ value, onChange, label, required = false, ...props }) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    if (value) {
      setDisplayValue(formatCurrency(value))
    } else {
      setDisplayValue('')
    }
  }, [value])

  const formatCurrency = (num) => {
    if (!num) return ''
    return Number(num).toLocaleString('id-ID')
  }

  const parseCurrency = (str) => {
    return str.replace(/\./g, '')
  }

  const handleChange = (e) => {
    const input = e.target.value
    const numericValue = parseCurrency(input)
    
    // Only allow numbers
    if (numericValue === '' || /^\d+$/.test(numericValue)) {
      setDisplayValue(numericValue ? formatCurrency(numericValue) : '')
      onChange(numericValue)
    }
  }

  return (
    <div>
      {label && <label>{label}</label>}
      <div className="flex items-center gap-2">
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          Rp
        </span>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          required={required}
          placeholder="0"
          {...props}
        />
      </div>
    </div>
  )
}
