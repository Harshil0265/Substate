/**
 * Timezone Formatter Utility
 * Converts dates to user's selected timezone
 */

export const formatDateWithTimezone = (date, timezone = 'UTC', locale = 'en-US') => {
  if (!date) return 'N/A'
  
  try {
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

export const formatDateTimeWithTimezone = (date, timezone = 'UTC', locale = 'en-US') => {
  if (!date) return 'N/A'
  
  try {
    const dateObj = new Date(date)
    return dateObj.toLocaleString(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting datetime:', error)
    return 'Invalid Date'
  }
}

export const formatTimeWithTimezone = (date, timezone = 'UTC', locale = 'en-US') => {
  if (!date) return 'N/A'
  
  try {
    const dateObj = new Date(date)
    return dateObj.toLocaleTimeString(locale, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting time:', error)
    return 'Invalid Time'
  }
}

export const getTimezoneOffset = (timezone = 'UTC') => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    })
    const parts = formatter.formatToParts(new Date())
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || timezone
    return timeZoneName
  } catch (error) {
    return timezone
  }
}
