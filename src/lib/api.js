import axios from "axios"
import { supabase } from "./supabase"

const BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!BASE_URL) {
  throw new Error(
    "[api.js] VITE_API_BASE_URL is not set.\n" +
      "Add to .env.development:\n" +
      "  VITE_API_BASE_URL=http://localhost:5000/api"
  )
}

function readSelectedLabId() {
  try {
    const value = sessionStorage.getItem("x-lab-id")

    if (
      !value ||
      value === "null" ||
      value === "undefined" ||
      String(value).trim() === ""
    ) {
      return null
    }

    return String(value).trim()
  } catch {
    return null
  }
}

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use(
  async (config) => {
    const nextConfig = { ...config }
    nextConfig.headers = nextConfig.headers || {}

    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token

    if (token) {
      nextConfig.headers.Authorization = `Bearer ${token}`
    } else {
      delete nextConfig.headers.Authorization
    }

    const selectedLabId = readSelectedLabId()

    if (selectedLabId) {
      nextConfig.headers["x-lab-id"] = selectedLabId
    } else {
      delete nextConfig.headers["x-lab-id"]
    }

    return nextConfig
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new Error("Request timed out. The backend may be restarting or hanging.")
      )
    }

    if (error.response) {
      const status = error.response.status
      const contentType = error.response.headers?.["content-type"] ?? ""

      if (contentType.includes("text/html")) {
        return Promise.reject(
          new Error(
            `API returned HTML instead of JSON (status ${status}). ` +
              `Check VITE_API_BASE_URL and backend deployment.`
          )
        )
      }

      return Promise.reject(error)
    }

    if (error.request) {
      return Promise.reject(
        new Error(
          "Unable to reach the backend. Check your network connection or backend server."
        )
      )
    }

    return Promise.reject(error)
  }
)

export default api