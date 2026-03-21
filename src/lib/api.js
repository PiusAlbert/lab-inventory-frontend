import axios from "axios"
import { supabase } from "../lib/supabase"

const BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!BASE_URL) {
  throw new Error(
    "[api.js] VITE_API_BASE_URL is not set.\n" +
    "Add to .env.development:\n" +
    "  VITE_API_BASE_URL=http://localhost:5000/api"
  )
}

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
})

api.interceptors.request.use(async (config) => {

  // Attach JWT
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  /**
   * Attach x-lab-id for SUPER_ADMIN lab scoping.
   * Read from sessionStorage — set by AuthContext when admin picks a lab.
   * Only attach if the value is a real non-empty string that isn't "null".
   */
  const labOverride = sessionStorage.getItem("x-lab-id")
  if (labOverride && labOverride !== "null" && labOverride !== "undefined") {
    config.headers["x-lab-id"] = labOverride
  }

  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const ct = error.response.headers?.["content-type"] ?? ""
      if (ct.includes("text/html")) {
        return Promise.reject(
          new Error(
            `API returned HTML instead of JSON. ` +
            `Check VITE_API_BASE_URL="${BASE_URL}" points to your backend. ` +
            `Status: ${error.response.status}`
          )
        )
      }
    }
    return Promise.reject(error)
  }
)

export default api