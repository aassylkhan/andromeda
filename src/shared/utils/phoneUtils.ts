/**
 * Phone utilities for normalization and formatting
 */

/**
 * Normalize phone input to digits only
 * Removes all non-digit characters
 * @param value - phone number with any formatting
 * @returns string with digits only
 */
export const normalizePhoneDigits = (value: string): string => {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

/**
 * Format phone digits for UI display
 * Prepends '+' to digits
 * @param digits - phone number digits (e.g., "77001234567")
 * @returns formatted phone (e.g., "+77001234567")
 */
export const formatPhoneForUi = (digits: string): string => {
  const normalized = normalizePhoneDigits(digits)
  if (!normalized) return ''
  return `+${normalized}`
}

/**
 * Extract digits from formatted phone (remove +)
 * @param phone - phone with + (e.g., "+77001234567")
 * @returns digits only (e.g., "77001234567")
 */
export const extractPhoneDigits = (phone: string): string => {
  return normalizePhoneDigits(phone)
}
