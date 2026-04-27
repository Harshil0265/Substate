import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Zap, 
  Target, 
  Sparkles, 
  Bot, 
  Smartphone, 
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  Award,
  Clock,
  Users,
  Send
} from 'lucide-react'
import Footer from '../components/Footer'
import LoadingSpinner from '../components/LoadingSpinner'
import useScrollAnimation from '../hooks/useScrollAnimation'
import '../styles/landing-pax.css'
import '../styles/footer.css'

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navVisible, setNavVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Initialize scroll animations
  useScrollAnimation()

  // Trigger nav visibility after hero animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setNavVisible(true)
    }, 4500) // Match the hero animation duration
    return () => clearTimeout(timer)
  }, [])

  // Handle page loading
  useEffect(() => {
    // Show loading for 2 seconds on page load/refresh
    const loadingTimer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    // Handle page visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsLoading(true)
        setTimeout(() => {
          setIsLoading(false)
        }, 1500)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(loadingTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setMobileMenuOpen(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>SUBSTATE - Revenue Intelligence & Content Automation Platform</title>
        <meta name="description" content="Track revenue intelligence, automate content creation, and optimize customer lifecycle with SUBSTATE." />
        <meta property="og:title" content="SUBSTATE - Revenue Intelligence Platform" />
        <meta property="og:description" content="Revenue Intelligence & Content Automation Platform" />
      </Helmet>

      <div className="landing-wrapper">
        {/* Navigation - At the top, but animates after trust section */}
        <nav className={`landing-nav ${navVisible ? 'nav-visible' : ''}`}>
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <img src="/substate-icon.svg" alt="SUBSTATE" className="logo-image" />
              <span>SUBSTATE</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="nav-menu">
              <Link to="/features" className="nav-link">Features</Link>
              <Link to="/services" className="nav-link">Services</Link>
              <Link to="/testimonials" className="nav-link">Testimonials</Link>
              <Link to="/about" className="nav-link">About</Link>
              <Link to="/contact" className="nav-link">Contact</Link>
            </div>

            <div className="nav-actions">
              <Link to="/login" className="nav-login">Sign In</Link>
              <Link to="/register" className="nav-button">Get Started Free</Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div 
              className="mobile-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Link to="/features" className="mobile-nav-link">Features</Link>
              <Link to="/services" className="mobile-nav-link">Services</Link>
              <Link to="/testimonials" className="mobile-nav-link">Testimonials</Link>
              <Link to="/about" className="mobile-nav-link">About</Link>
              <Link to="/contact" className="mobile-nav-link">Contact</Link>
              <Link to="/login" className="mobile-nav-link">Sign In</Link>
              <Link to="/register" className="mobile-nav-button">Get Started Free</Link>
            </motion.div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="hero-section" id="home">
          <div className="hero-container">
            <motion.div
              className="hero-content-autopilot"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Hero Visual - Image in front, Text behind */}
              <div className="hero-visual">
                {/* Text Layer - Behind */}
                <div className="hero-text-layer">
                  <h1 className="hero-title-overlay">
                    <span className="title-word">PREDICT.</span>
                    <span className="title-word">AUTOMATE.</span>
                    <span className="title-word">PROFIT.</span>
                  </h1>
                </div>
                {/* Image Layer - In Front */}
                <img src="/hero element.png" alt="Revenue Intelligence Automation" className="hero-illustration" />
              </div>
              
              <p className="hero-subtitle-autopilot">
                We handle your content from idea to publish, so you can grow traffic and revenue without hiring a team.
              </p>

              <div className="hero-cta-autopilot">
                <Link to="/register" className="cta-primary-autopilot">
                  Start Free Trial
                  <ArrowRight size={20} />
                </Link>
                <button 
                  onClick={() => scrollToSection('how-it-works')} 
                  className="cta-secondary-autopilot"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  See How It Works
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section" id="how-it-works">
          <div className="how-it-works-container">
            {/* Header */}
            <motion.div 
              className="how-it-works-header"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="how-it-works-title">How it works</h2>
              <p className="how-it-works-subtitle">
                From idea to published content — fully automated in minutes.
              </p>
            </motion.div>

            {/* Main Content - Two Column Layout */}
            <div className="how-it-works-content">
              {/* Left: Dashboard Mockup */}
              <motion.div
                className="how-it-works-dashboard"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="dashboard-mockup">
                  <div className="dashboard-header">
                    <div className="dashboard-dot"></div>
                    <div className="dashboard-dot"></div>
                    <div className="dashboard-dot"></div>
                    <span className="dashboard-title">Dashboard</span>
                  </div>
                  <div className="dashboard-content">
                    <div className="dashboard-stat">
                      <div className="stat-label">Articles Generated</div>
                      <div className="stat-value">1,247</div>
                      <div className="stat-bar">
                        <div className="stat-bar-fill"></div>
                      </div>
                    </div>
                    <div className="dashboard-stat">
                      <div className="stat-label">Organic Traffic</div>
                      <div className="stat-value">+340%</div>
                      <div className="stat-bar">
                        <div className="stat-bar-fill"></div>
                      </div>
                    </div>
                    <div className="dashboard-stat">
                      <div className="stat-label">Revenue Generated</div>
                      <div className="stat-value">$45.2K</div>
                      <div className="stat-bar">
                        <div className="stat-bar-fill"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right: Timeline */}
              <motion.div
                className="how-it-works-timeline"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                {/* Step 1 */}
                <div className="timeline-step">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-step-number">Step 1</div>
                    <h3 className="timeline-step-title">Connect your WordPress</h3>
                    <p className="timeline-step-description">
                      Link your site in seconds. No technical setup required.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="timeline-step">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-step-number">Step 2</div>
                    <h3 className="timeline-step-title">Generate content & campaigns</h3>
                    <p className="timeline-step-description">
                      AI creates SEO articles and marketing campaigns tailored to your business.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="timeline-step">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-step-number">Step 3</div>
                    <h3 className="timeline-step-title">Auto-publish & grow</h3>
                    <p className="timeline-step-description">
                      Content is published directly to your site — bringing traffic and revenue.
                    </p>
                  </div>
                </div>

                {/* Trust Badges */}
                <motion.div
                  className="how-it-works-trust"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true, margin: "-50px" }}
                >
                  <div className="trust-badge">
                    <Clock size={20} />
                    <span>Setup takes less than 5 minutes</span>
                  </div>
                  <div className="trust-badge">
                    <Users size={20} />
                    <span>No technical skills required</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* CTA Section */}
            <motion.div
              className="how-it-works-cta-section"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <Link to="/register" className="how-it-works-cta-button">
                Start Free Trial
                <ArrowRight size={20} />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* What You Actually Get Section */}
        <section className="outcomes-section">
          <div className="section-container">
            <motion.div 
              className="section-header"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 
                className="section-title-large"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                What you actually get
              </motion.h2>
              <motion.p 
                className="section-subtitle"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                Instead of features, here are the real outcomes you'll see
              </motion.p>
            </motion.div>

            <div className="outcomes-grid">
              <motion.div
                className="outcome-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="outcome-icon">
                  <Target size={32} color="#FF6B35" />
                </div>
                <h3 className="outcome-title">Consistent SEO articles published automatically</h3>
                <p className="outcome-description">Your content calendar runs itself with high-quality, SEO-optimized articles published on schedule.</p>
              </motion.div>

              <motion.div
                className="outcome-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="outcome-icon">
                  <TrendingUp size={32} color="#FF6B35" />
                </div>
                <h3 className="outcome-title">More organic traffic without manual effort</h3>
                <p className="outcome-description">Watch your website traffic grow steadily as our AI creates content that ranks and converts.</p>
              </motion.div>

              <motion.div
                className="outcome-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="outcome-icon">
                  <Zap size={32} color="#FF6B35" />
                </div>
                <h3 className="outcome-title">Campaigns that drive real conversions</h3>
                <p className="outcome-description">Every piece of content is strategically designed to move prospects through your sales funnel.</p>
              </motion.div>

              <motion.div
                className="outcome-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="outcome-icon">
                  <Clock size={32} color="#FF6B35" />
                </div>
                <h3 className="outcome-title">Save 20+ hours every week</h3>
                <p className="outcome-description">Reclaim your time from content creation and focus on growing your business instead.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Everything You Need Section */}
        <section className="everything-section">
          <div className="section-container">
            <motion.div 
              className="section-header"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 
                className="section-title-large"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                Everything you need to grow — in one place
              </motion.h2>
            </motion.div>

            <div className="everything-grid">
              <motion.div
                className="everything-item"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="everything-icon">
                  <Bot size={28} color="#FF6B35" />
                </div>
                <div className="everything-content">
                  <h3 className="everything-title">Content Generation</h3>
                  <p className="everything-description">AI writes high-quality SEO articles</p>
                </div>
                <motion.div 
                  className="everything-arrow"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <ArrowRight size={20} color="#FF6B35" />
                </motion.div>
              </motion.div>

              <motion.div
                className="everything-item"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="everything-icon">
                  <Zap size={28} color="#FF6B35" />
                </div>
                <div className="everything-content">
                  <h3 className="everything-title">Campaign Engine</h3>
                  <p className="everything-description">Creates and runs marketing campaigns</p>
                </div>
                <motion.div 
                  className="everything-arrow"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <ArrowRight size={20} color="#FF6B35" />
                </motion.div>
              </motion.div>

              <motion.div
                className="everything-item"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="everything-icon">
                  <Smartphone size={28} color="#FF6B35" />
                </div>
                <div className="everything-content">
                  <h3 className="everything-title">WordPress Integration</h3>
                  <p className="everything-description">Auto-publish without effort</p>
                </div>
                <motion.div 
                  className="everything-arrow"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <ArrowRight size={20} color="#FF6B35" />
                </motion.div>
              </motion.div>

              <motion.div
                className="everything-item"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="everything-icon">
                  <BarChart3 size={28} color="#FF6B35" />
                </div>
                <div className="everything-content">
                  <h3 className="everything-title">Analytics</h3>
                  <p className="everything-description">Track performance & growth</p>
                </div>
                <motion.div 
                  className="everything-arrow"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <ArrowRight size={20} color="#FF6B35" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="testimonials-section" id="testimonials">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">SUCCESS STORIES</span>
              <h2 className="section-title">Trusted by Thousands of Growing Businesses</h2>
              <p className="section-subtitle">
                Don't just take our word for it. Here's what our clients say about their experience with SUBSTATE.
              </p>
            </div>

            <div className="testimonials-grid">
              <motion.div
                className="testimonial-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">
                  "SUBSTATE's revenue intelligence platform transformed our business. We reduced churn by 35% 
                  in just 3 months and increased customer lifetime value by 50%. The AI predictions are incredibly accurate."
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">AM</div>
                  <div className="author-info">
                    <div className="author-name">Arjun Mehta</div>
                    <div className="author-title">CEO • NexaVentures</div>
                    <div className="author-meta">
                      <span className="meta-badge">Revenue Intelligence</span>
                      <span className="meta-time">35% churn reduction</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="testimonial-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">
                  "The content automation is a game-changer. We went from publishing 10 articles per month to 300+ 
                  while maintaining quality. Our organic traffic increased by 400% in 6 months."
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">PS</div>
                  <div className="author-info">
                    <div className="author-name">Priya Sharma</div>
                    <div className="author-title">Marketing Director • GrowthLabs India</div>
                    <div className="author-meta">
                      <span className="meta-badge">Content Automation</span>
                      <span className="meta-time">400% traffic increase</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="testimonial-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">
                  "Best investment we've made this year. The revenue forecasting is spot-on, and the campaign 
                  automation saved us 20 hours per week. ROI was positive within the first month."
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">RV</div>
                  <div className="author-info">
                    <div className="author-name">Rahul Verma</div>
                    <div className="author-title">Founder • StartupNest</div>
                    <div className="author-meta">
                      <span className="meta-badge">Full Platform</span>
                      <span className="meta-time">20hrs/week saved</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="testimonials-cta">
              <h3>Ready to write your success story?</h3>
              <p>Join 10,000+ businesses who have successfully optimized their revenue with SUBSTATE.</p>
              <div className="cta-buttons">
                <Link to="/register" className="cta-primary">
                  Start Free Trial
                  <ArrowRight size={20} />
                </Link>
                <button onClick={() => scrollToSection('pricing')} className="cta-secondary">
                  View Pricing
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="pricing-section" id="pricing">
          <div className="section-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="section-header"
            >
              <h2 className="section-title">Simple, Transparent Pricing</h2>
              <p className="section-subtitle">Choose the plan that fits your revenue goals</p>
            </motion.div>

            <div className="pricing-grid">
              <motion.div
                className="pricing-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="pricing-header">
                  <h3>Starter</h3>
                  <div className="pricing-price">
                    <span className="price-currency">₹</span>
                    <span className="price-amount">0</span>
                    <span className="price-period">/month</span>
                  </div>
                  <div className="pricing-trial-badge">14-Day Free Trial</div>
                </div>
                <ul className="pricing-features">
                  <li>✓ Up to 5 campaigns</li>
                  <li>✓ 100 AI-generated articles/month</li>
                  <li>✓ Basic revenue analytics</li>
                  <li>✓ Email support</li>
                  <li>✓ 1 WordPress integration</li>
                  <li>✓ Customer value tracking</li>
                </ul>
                <Link to="/register" className="pricing-button">Start Free Trial</Link>
              </motion.div>

              <motion.div
                className="pricing-card pricing-card-featured"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="pricing-badge">Most Popular</div>
                <div className="pricing-header">
                  <h3>Professional</h3>
                  <div className="pricing-price">
                    <span className="price-currency">₹</span>
                    <span className="price-amount">10</span>
                    <span className="price-period">/month</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  <li>✓ Unlimited campaigns</li>
                  <li>✓ 500 AI articles/month</li>
                  <li>✓ Advanced revenue intelligence</li>
                  <li>✓ Priority support</li>
                  <li>✓ 5 WordPress integrations</li>
                  <li>✓ Churn prediction AI</li>
                  <li>✓ Revenue forecasting</li>
                  <li>✓ Multi-channel publishing</li>
                </ul>
                <Link to="/register" className="pricing-button pricing-button-featured">Start Free Trial</Link>
              </motion.div>

              <motion.div
                className="pricing-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="pricing-header">
                  <h3>Enterprise</h3>
                  <div className="pricing-price">
                    <span className="price-currency">₹</span>
                    <span className="price-amount">20</span>
                    <span className="price-period">/month</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  <li>✓ Unlimited everything</li>
                  <li>✓ Custom AI models</li>
                  <li>✓ White-label platform</li>
                  <li>✓ 24/7 phone support</li>
                  <li>✓ Unlimited integrations</li>
                  <li>✓ API access</li>
                  <li>✓ Dedicated account manager</li>
                  <li>✓ Custom revenue models</li>
                </ul>
                <Link to="/register" className="pricing-button">Get Started</Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact-section" id="contact">
          <div className="section-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="section-header"
            >
              <span className="section-tag">GET IN TOUCH</span>
              <h2 className="section-title">Let's Start a Conversation</h2>
              <p className="section-subtitle">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
            </motion.div>

            <div className="contact-content-modern">
              <motion.div
                className="contact-info-cards"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="contact-info-card">
                  <div className="contact-card-icon">
                    <Phone size={28} />
                  </div>
                  <div className="contact-card-content">
                    <h4>Call Us</h4>
                    <p>Mon-Fri 9am-6pm IST</p>
                    <a href="tel:+919664972848" className="contact-card-link">+91 9664972848</a>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-card-icon">
                    <Mail size={28} />
                  </div>
                  <div className="contact-card-content">
                    <h4>Email Us</h4>
                    <p>We'll respond within 24 hours</p>
                    <a href="mailto:support@substate.com" className="contact-card-link">support@substate.com</a>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-card-icon">
                    <MapPin size={28} />
                  </div>
                  <div className="contact-card-content">
                    <h4>Visit Us</h4>
                    <p>B-4 Sanidhya Tenament, Near C.H. Vidyalay</p>
                    <p>High Tension Road, Subhanpura, Samta</p>
                    <p>Vadodara - 390023, Gujarat, India</p>
                  </div>
                </div>
              </motion.div>

              <motion.form
                className="contact-form-enhanced"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                onSubmit={(e) => {
                  e.preventDefault()
                  alert('Thank you for your message! We will get back to you soon.')
                }}
              >
                <div className="form-header">
                  <h3>Send us a Message</h3>
                  <p>Fill out the form below and we'll get back to you shortly</p>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Your Name *</label>
                    <input type="text" id="name" placeholder="Your full name" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input type="email" id="email" placeholder="your@email.com" required />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input type="text" id="subject" placeholder="How can we help you?" required />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea id="message" placeholder="Tell us more about your inquiry..." rows="5" required></textarea>
                </div>

                <button type="submit" className="contact-submit-enhanced">
                  <Send size={20} />
                  Send Message
                </button>
              </motion.form>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}

export default Landing
