import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import '../styles/landing.css'

function Landing() {
  return (
    <>
      <Helmet>
        <title>SUBSTATE - Revenue Intelligence & Content Automation Platform</title>
        <meta name="description" content="Track revenue intelligence, automate content creation, and optimize customer lifecycle with SUBSTATE." />
        <meta property="og:title" content="SUBSTATE - Revenue Intelligence Platform" />
        <meta property="og:description" content="Revenue Intelligence & Content Automation Platform" />
      </Helmet>

      <div className="landing-wrapper">
        {/* Navigation */}
        <nav className="landing-nav">
          <div className="nav-container">
            <div className="nav-logo">SUBSTATE</div>
            <div className="nav-links">
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-button">Get Started</Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-section">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="hero-title">
              Revenue Intelligence Meets Content Automation
            </h1>
            <p className="hero-subtitle">
              Track customer value, detect churn risk, and automate content workflows in one elegant platform.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="cta-primary">Start Free Trial</Link>
              <Link to="/login" className="cta-secondary">Sign In</Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2>Powerful Features</h2>
          <div className="features-grid">
            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="feature-icon">📊</div>
              <h3>Revenue Intelligence</h3>
              <p>Real-time analytics on customer value and churn risk scoring</p>
            </motion.div>

            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="feature-icon">🤖</div>
              <h3>Content Automation</h3>
              <p>AI-powered content generation and campaign automation</p>
            </motion.div>

            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="feature-icon">📱</div>
              <h3>WordPress Integration</h3>
              <p>Seamlessly publish and manage content across platforms</p>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <p>&copy; 2024 SUBSTATE. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}

export default Landing
