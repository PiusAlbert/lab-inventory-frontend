/**
 * Single source of truth for the SUPER_ADMIN lab selection stored in sessionStorage.
 *
 * Both AuthContext (for React state) and the Axios interceptor (for headers)
 * read from this module so any sanitization change only needs to be made once.
 *
 * sessionStorage is intentionally used (not localStorage) so the selection
 * resets when the browser tab is closed.
 */

const KEY = 'x-lab-id'

function isSanitized(value) {
  return (
    value != null &&
    value !== 'null' &&
    value !== 'undefined' &&
    String(value).trim() !== ''
  )
}

/** Returns the stored lab ID, or null if absent / invalid. */
export function getStoredLabId() {
  try {
    const value = sessionStorage.getItem(KEY)
    return isSanitized(value) ? String(value).trim() : null
  } catch {
    return null
  }
}

/**
 * Persists a lab ID.  Passing null / undefined / empty removes the value
 * so the backend receives no x-lab-id header (all-labs mode).
 */
export function setStoredLabId(value) {
  try {
    if (isSanitized(value)) {
      sessionStorage.setItem(KEY, String(value).trim())
    } else {
      sessionStorage.removeItem(KEY)
    }
  } catch {
    // sessionStorage may be unavailable in private-browsing edge cases.
  }
}

/** The HTTP header name consumed by the backend auth middleware. */
export const LAB_ID_HEADER = KEY
