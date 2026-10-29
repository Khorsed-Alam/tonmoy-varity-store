/**
 * Validation utilities for customer forms and orders
 */

/**
 * Validates Bangladeshi mobile phone numbers (e.g. 017XXXXXXXX, +88017XXXXXXXX, 01XXXXXXXXX)
 * @param {string} phone
 * @returns {boolean}
 */
export function validateBangladeshiPhone(phone) {
  if (!phone) return false
  const cleanPhone = phone.replace(/[\s-]/g, '')
  // Accepts 013-019 prefixes with 11 digits total (or +8801...)
  const bdPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/
  return bdPhoneRegex.test(cleanPhone)
}

/**
 * Validates standard email address
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Checks if a string or number is non-empty
 * @param {any} value
 * @returns {boolean}
 */
export function validateRequired(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

/**
 * Validates product price & stock positive numbers
 * @param {number|string} num
 * @returns {boolean}
 */
export function validatePositiveNumber(num) {
  const parsed = Number(num)
  return !isNaN(parsed) && parsed >= 0
}

