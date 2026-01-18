import axios from "axios"

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000/api"

export const authStorage = {
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token)
    }
  },
  clearToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
    }
  },
  getUser: () => {
    if (typeof window === "undefined") return null
    const raw = localStorage.getItem("user")
    return raw ? (JSON.parse(raw) as { id: string; email: string; name?: string | null }) : null
  },
  setUser: (user: { id: string; email: string; name?: string | null }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user))
    }
  },
  clearUser: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
    }
  },
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api
