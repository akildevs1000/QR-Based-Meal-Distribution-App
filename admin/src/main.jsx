import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* HashRouter when running under file:// (Electron); BrowserRouter for dev/server. */}
      {window.location.protocol === 'file:'
        ? <HashRouter><App /></HashRouter>
        : <BrowserRouter><App /></BrowserRouter>}
    </QueryClientProvider>
  </StrictMode>,
)
