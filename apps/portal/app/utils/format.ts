import { format, formatDistanceToNow, isToday } from 'date-fns'
import { de } from 'date-fns/locale'

export const shortDate = (value: string) => {
  const date = new Date(value)
  return isToday(date) ? format(date, 'HH:mm') : format(date, 'd. MMM', { locale: de })
}
export const longDate = (value: string) => format(new Date(value), 'd. MMM yyyy, HH:mm', { locale: de })
export const relativeDate = (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true, locale: de })

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join('') || '?'
