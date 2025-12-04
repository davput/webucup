import { format, isValid, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Safely format date with fallback for invalid dates
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (default: 'dd MMM yyyy HH:mm')
 * @param {string} fallback - Fallback text for invalid dates (default: '-')
 * @returns {string} Formatted date or fallback
 */
export function safeFormatDate(date, formatStr = 'dd MMM yyyy HH:mm', fallback = '-') {
  if (!date) {
    console.warn('safeFormatDate: date is null or undefined')
    return fallback
  }
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    // Check if date is valid
    if (!isValid(dateObj)) {
      console.warn('safeFormatDate: invalid date object', date)
      return fallback
    }
    
    // Check if date is Unix epoch (1970-01-01) or before 2020
    const timestamp = dateObj.getTime()
    if (timestamp === 0 || timestamp < new Date('2020-01-01').getTime()) {
      console.warn('safeFormatDate: date is epoch or too old', date, timestamp)
      return fallback
    }
    
    return format(dateObj, formatStr, { locale: id })
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return fallback
  }
}

/**
 * Check if date is valid and not Unix epoch
 * @param {string|Date} date - Date to check
 * @returns {boolean}
 */
export function isValidDate(date) {
  if (!date) return false
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return isValid(dateObj) && dateObj.getTime() !== 0
  } catch {
    return false
  }
}

/**
 * Format date for display (short format)
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateShort(date) {
  return safeFormatDate(date, 'dd MMM yyyy')
}

/**
 * Format date with time
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  return safeFormatDate(date, 'dd MMM yyyy HH:mm')
}

/**
 * Format date for input field (YYYY-MM-DD)
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateForInput(date) {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    return format(dateObj, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}
