import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Login from './Login.jsx'
import Signup from './Signup.jsx'
import ClickHistory from './ClickHistory.jsx'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [originalUrl, setOriginalUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [urls, setUrls] = useState([])
  const [urlsError, setUrlsError] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [location])

  useEffect(() => {
    if (isAuthenticated) {
      fetchUrls()
    }
  }, [isAuthenticated])

  const fetchUrls = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('Token:', token)
      console.log('API URL:', `${import.meta.env.VITE_API_BASE_URL}/urls`)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/urls`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      if (response.ok) {
        setUrls(data)
        setUrlsError('')
      } else {
        setUrlsError(data.message || 'Failed to load URLs')
      }
    } catch (err) {
      setUrlsError('Failed to load URLs: ' + err.message)
      console.error('Failed to fetch URLs:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShortUrl('')

    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ originalUrl }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setShortUrl(data.shortUrl)
      fetchUrls() // Refresh the list
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => {
      alert('Failed to copy')
    })
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/dashboard" element={
        <div className="app">
          <button onClick={handleLogout} style={{ position: 'absolute', top: 10, right: 10 }}>Logout</button>
          <h1>URL Shortener</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="Enter your long URL here"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Shortening...' : 'Shorten URL'}
            </button>
          </form>
          {shortUrl && (
            <div className="short-url-result">
              <p>Short URL: 
                <a href={shortUrl} target="_blank" rel="noopener noreferrer">{shortUrl}</a>
                <button 
                  className="copy-btn"
                  onClick={() => copyToClipboard(shortUrl, 'shortUrl')}
                  title="Copy to clipboard"
                >
                  {copiedId === 'shortUrl' ? 'Copied' : 'Copy'}
                </button>
              </p>
            </div>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <h2>Your Shortened URLs</h2>
          {urlsError && <p style={{ color: 'red' }}>{urlsError}</p>}
          {urls.length === 0 && !urlsError ? (
            <p>No URLs shortened yet.</p>
          ) : (
            <table border={2}>
              <thead>
                <tr>
                  <th>Original URL</th>
                  <th>Short URL</th>
                  <th>Clicks</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {urls.map(url => (
                  <tr key={url.id}>
                    <td>{url.original_url}</td>
                    <td>
                      <div className="url-cell">
                        <a href={`http://10.1.50.172:5000/${url.short_code}`} target="_blank" rel="noopener noreferrer">http://10.1.50.172:5000/{url.short_code}</a>
                        <button 
                          className="copy-btn"
                          onClick={() => copyToClipboard(`http://10.1.50.172:5000/${url.short_code}`, url.id)}
                          title="Copy to clipboard"
                        >
                          {copiedId === url.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </td>
                    <td>{url.clicks}</td>
                    <td>{new Date(url.created_at).toLocaleString()}</td>
                    <td><button onClick={() => navigate(`/clicks/${url.id}`)}>View Clicks</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {urls.length > 0 && (
            <div className="chart-container">
              <h3>Clicks Analytics</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={urls.map(url => ({
                  name: url.short_code,
                  clicks: url.clicks,
                  fullUrl: url.original_url
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis 
                    domain={[0, 'dataMax']} 
                    interval={0}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value, 'Clicks']}
                    labelFormatter={(label, payload) => `Short Code: ${label}`}
                  />
                  <Bar dataKey="clicks" fill="#007bff" barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      } />
      <Route path="/clicks/:id" element={<ClickHistory />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
