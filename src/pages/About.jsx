import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Target, 
  Eye, 
  Heart, 
  Users, 
  Award, 
  TrendingUp,
  Sparkles,
  ArrowRight,
  Mail,
  Globe,
  Zap,
  Shield,
  Clock
} from 'lucide-react'
import Footer from '../components/Footer'
import useScrollAnimation from '../hooks/useScrollAnimation'
import '../styles/landing-pax.css'
import '../styles/pages.css'

function About() {
  // Initialize scroll animations
  useScrollAnimation()

  const values = [
    {
      icon: <Target size={32} />,
      title: 'Customer First',
      description: 'Every decision we make starts with our customers. Their success is our success.'
    },
    {
      icon: <Sparkles size={32} />,
      title: 'Innovation',
      description: 'We push boundaries with cutting-edge AI and machine learning technology.'
    },
    {
      icon: <Shield size={32} />,
      title: 'Trust & Security',
      description: 'We protect your data with enterprise-grade security and transparency.'
    },
    {
      icon: <Heart size={32} />,
      title: 'Integrity',
      description: 'We operate with honesty, transparency, and ethical business practices.'
    },
    {
      icon: <Users size={32} />,
      title: 'Collaboration',
      description: 'We believe in the power of teamwork and building strong partnerships.'
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from product to support.'
    }
  ]

  const milestones = [
    { year: '2020', title: 'Company Founded', description: 'Started with a vision to revolutionize revenue intelligence' },
    { year: '2021', title: '1,000 Customers', description: 'Reached our first major milestone with 1K happy customers' },
    { year: '2022', title: 'Series A Funding', description: 'Raised $15M to accelerate product development' },
    { year: '2023', title: '10,000 Customers', description: 'Grew to 10K+ businesses using our platform' },
    { year: '2024', title: 'Global Expansion', description: 'Expanded to 50+ countries with 24/7 support' },
    { year: '2026', title: 'Industry Leader', description: 'Recognized as the #1 revenue intelligence platform' }
  ]

  return (
    <>
      <Helmet>
        <title>About Us - SUBSTATE Revenue Intelligence Platform</title>
        <meta name="description" content="Learn about SUBSTATE's mission to revolutionize revenue intelligence with AI-powered automation and analytics." />
      </Helmet>

      <div className="landing-wrapper">
        {/* Navigation */}
        <nav className="landing-nav nav-page">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <img src="/substate-icon.svg" alt="SUBSTATE" className="logo-image" />
              <span>SUBSTATE</span>
            </Link>
            <div className="nav-menu">
              <Link to="/features" className="nav-link">Features</Link>
              <Link to="/services" className="nav-link">Services</Link>
              <Link to="/testimonials" className="nav-link">Testimonials</Link>
              <Link to="/about" className="nav-link active">About</Link>
              <Link to="/contact" className="nav-link">Contact</Link>
            </div>
            <div className="nav-actions">
              <Link to="/login" className="nav-login">Sign In</Link>
              <Link to="/register" className="nav-button">Get Started Free</Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="page-hero">
          <div className="section-container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="page-hero-content"
            >
              <div className="page-hero-badge">
                <Sparkles size={16} />
                <span>About SUBSTATE</span>
              </div>
              <h1 className="page-hero-title">Revolutionizing Revenue Intelligence</h1>
              <p className="page-hero-subtitle">
                We're on a mission to help businesses predict, automate, and profit with 
                AI-powered revenue intelligence that works 24/7.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mission-vision-section">
          <div className="section-container">
            <div className="mission-vision-grid">
              <motion.div
                className="mission-card"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Target size={48} className="mission-icon" />
                <h2>Our Mission</h2>
                <p>
                  To empower businesses of all sizes with AI-powered revenue intelligence 
                  that was once only available to enterprise companies. We believe every 
                  business deserves access to world-class analytics and automation tools.
                </p>
              </motion.div>

              <motion.div
                className="vision-card"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Eye size={48} className="vision-icon" />
                <h2>Our Vision</h2>
                <p>
                  To become the world's most trusted revenue intelligence platform, helping 
                  millions of businesses predict customer behavior, automate content creation, 
                  and maximize revenue with unprecedented accuracy.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="about-stats-section">
          <div className="section-container">
            <div className="about-stats-grid">
              <motion.div
                className="about-stat-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Users size={40} />
                <div className="stat-number">10,000+</div>
                <div className="stat-label">Active Customers</div>
              </motion.div>

              <motion.div
                className="about-stat-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Globe size={40} />
                <div className="stat-number">50+</div>
                <div className="stat-label">Countries Served</div>
              </motion.div>

              <motion.div
                className="about-stat-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Zap size={40} />
                <div className="stat-number">50K+</div>
                <div className="stat-label">Content Generated</div>
              </motion.div>

              <motion.div
                className="about-stat-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Award size={40} />
                <div className="stat-number">99.8%</div>
                <div className="stat-label">Accuracy Rate</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="story-section">
          <div className="section-container">
            <motion.div
              className="story-content"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="section-header">
                <span className="section-tag">OUR STORY</span>
                <h2 className="section-title">How SUBSTATE Was Born</h2>
              </div>
              <div className="story-text">
                <p>
                  In 2020, our founders were frustrated with the lack of accessible, accurate revenue 
                  intelligence tools for growing businesses. Enterprise solutions were too expensive 
                  and complex, while affordable options lacked the AI capabilities needed for accurate predictions.
                </p>
                <p>
                  We set out to change that. By combining cutting-edge machine learning with an intuitive 
                  interface, we created SUBSTATE - a platform that delivers enterprise-grade revenue 
                  intelligence at a fraction of the cost.
                </p>
                <p>
                  Today, we're proud to serve over 10,000 businesses worldwide, helping them predict 
                  churn, automate content, and maximize revenue with 99.8% accuracy. But we're just 
                  getting started.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Timeline */}
        <section className="timeline-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">OUR JOURNEY</span>
              <h2 className="section-title">Key Milestones</h2>
            </div>

            <div className="timeline">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  className="timeline-item"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <div className="timeline-marker">
                    <Clock size={24} />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-year">{milestone.year}</div>
                    <h4>{milestone.title}</h4>
                    <p>{milestone.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="values-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">OUR VALUES</span>
              <h2 className="section-title">What We Stand For</h2>
            </div>

            <div className="values-grid">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  className="value-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="value-icon">{value.icon}</div>
                  <h4>{value.title}</h4>
                  <p>{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="section-container">
            <motion.div
              className="cta-content"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Mail size={48} className="cta-icon" />
              <h2>Want to Join Our Journey?</h2>
              <p>We're always looking for talented people to join our team</p>
              <div className="cta-buttons">
                <a href="mailto:careers@substate.com" className="cta-primary">
                  View Open Positions
                  <ArrowRight size={20} />
                </a>
                <Link to="/register" className="cta-secondary">
                  Try SUBSTATE Free
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}

export default About
