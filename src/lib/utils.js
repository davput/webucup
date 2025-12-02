// Format number to Indonesian Rupiah
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'Rp 0'
  return `Rp ${Number(amount).toLocaleString('id-ID')}`
}

// Format number with thousand separator
export const formatNumber = (number) => {
  if (!number && number !== 0) return '0'
  return Number(number).toLocaleString('id-ID')
}

// Parse formatted currency back to number
export const parseCurrency = (formattedValue) => {
  if (!formattedValue) return 0
  return Number(formattedValue.toString().replace(/[^0-9.-]+/g, ''))
}
