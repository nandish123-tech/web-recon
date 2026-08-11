/**
 * API service layer — all backend calls go through here.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      'An unknown error occurred'
    return Promise.reject(new Error(message))
  }
)

export const scansApi = {
  /** Start a new scan */
  create: (target) => api.post('/scans', { target }).then((r) => r.data),

  /** Get scan status and results */
  get: (scanId) => api.get(`/scans/${scanId}`).then((r) => r.data),

  /** List all scans */
  list: (limit = 50) => api.get('/scans', { params: { limit } }).then((r) => r.data),

  /** Delete a scan */
  delete: (scanId) => api.delete(`/scans/${scanId}`),

  /** Get HTML report URL */
  reportUrl: (scanId) => `/api/scans/${scanId}/report`,

  /** Get PDF report URL */
  pdfReportUrl: (scanId) => `/api/scans/${scanId}/report/pdf`,
}

export const healthApi = {
  check: () => api.get('/health').then((r) => r.data),
}

export default api
