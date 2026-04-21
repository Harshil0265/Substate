import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import '../styles/back-to-home.css'

function BackToHome() {
  return (
    <Link to="/" className="back-to-home-button" aria-label="Back to Home">
      <Home size={20} />
      <span>Back to Home</span>
    </Link>
  )
}

export default BackToHome
