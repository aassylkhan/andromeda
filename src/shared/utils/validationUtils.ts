/**
 * Validation utilities for employees
 */

/**
 * Validate Gmail email address
 * @param email - email to validate
 * @returns true if valid Gmail address
 */
export const isValidGmail = (email: string): boolean => {
  const trimmed = email.trim().toLowerCase()
  return trimmed.endsWith('@gmail.com') && trimmed.length > '@gmail.com'.length
}

/**
 * Validate phone number - must be digits only, at least 10
 * @param phone - phone to validate (digits or with +)
 * @returns true if valid
 */
export const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10
}

/**
 * Validate IIN or passport number - must be digits only, at least 6
 * @param pnOrIin - passport number or IIN
 * @returns true if valid
 */
export const isValidPnOrIin = (pnOrIin: string): boolean => {
  const digits = pnOrIin.replace(/\D/g, '')
  return digits.length >= 6
}
