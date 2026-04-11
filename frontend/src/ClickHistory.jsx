import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function ClickHistory() {
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetchClicks()
  }, [id])

  const fetchClicks = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('Fetching clicks for URL ID:', id)
      console.log('API URL:', `${import.meta.env.VITE_API_BASE_URL}/urls/${id}/clicks`)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/urls/${id}/clicks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      if (response.ok) {
        setClicks(data)
      } else {
        setError(data.message || 'Failed to fetch click history')
      }
    } catch (err) {
      setError('Failed to fetch click history: ' + err.message)
      console.error('Error fetching clicks:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <div><p style={{ color: 'red' }}>{error}</p><button onClick={() => navigate('/dashboard')}>Back to Dashboard</button></div>

  return (
    <div className="click-history">
      <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      <h2>Click History</h2>
      {clicks.length === 0 ? (
        <p>No clicks yet.</p>
      ) : (
        <table border="1">
          <thead>
            <tr>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {clicks.map((click, index) => (
              <tr key={index}>
                <td>{new Date(click.redirected_time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ClickHistory