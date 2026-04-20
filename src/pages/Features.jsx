import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Zap, 
  Target, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Brain, 
  Shield,
  Clock,
  Globe,
  Layers,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import Footer from '../components/Footer'
import useScrollAnimation from '../hooks/useScrollAnimation'
import '../styles/landing-pax.css'
import '../styles/pages.css'

function Features() {
  // Initialize scroll animations
  useScrollAnimation()

  return (
    <>
      <Helmet>
        <title>Features - SUBSTATE Revenue Intelligence Platform</title>
        <meta name="description" content="Explore powerful features of SUBSTATE including AI-powered analytics, content automation, and revenue intelligence." />
      </Helmet>

      <div className="landing-wrapper">
        {/* Navigation */}
        <nav className="landing-nav">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <img src="/substate-icon.svg" alt="SUBSTATE" className="logo-image" />
              <span>SUBSTATE</span>
            </Link>
            
            <div className="nav-menu">
              <Link to="/features" className="nav-link active">Features</Link>
              <Link to="/services" className="nav-link">Services</Link>
              <Link to="/testimonials" className="nav-link">Testimonials</Link>
              <Link to="/about" className="nav-link">About</Link>
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
                <span>Powerful Features</span>
              </div>
              <h1 className="page-hero-title">Everything You Need for Revenue Growth</h1>
              <p className="page-hero-subtitle">
                From AI-powered analytics to automated content creation, we provide comprehensive 
                tools to make your revenue optimization journey smooth and successful.
              </p>
              <div className="page-hero-cta">
                <Link to="/register" className="cta-primary-autopilot">
                  Start Free Trial
                  <ArrowRight size={20} />
                </Link>
                <Link to="/services" className="cta-secondary">
                  Explore Services
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Features Grid */}
        <section className="features-section">
          <div className="section-container">
            <div className="features-grid-large">
              <motion.div
                className="feature-card-large"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon-large">
                  <BarChart3 size={32} />
                </div>
                <div className="feature-badge">AI-Powered Analytics</div>
                <h3>Revenue Intelligence</h3>
                <p>Advanced AI algorithms analyze customer behavior, predict churn, and identify revenue opportunities in real-time.</p>
                <ul className="feature-list">
                  <li><CheckCircle2 size={18} /> Customer Lifetime Value Tracking</li>
                  <li><CheckCircle2 size={18} /> Churn Prediction Models</li>
                  <li><CheckCircle2 size={18} /> Revenue Forecasting</li>
                  <li><CheckCircle2 size={18} /> Real-time Analytics Dashboard</li>
                </ul>
              </motion.div>

              <motion.div
                className="feature-card-large"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon-large">
                  <Zap size={32} />
                </div>
                <div className="feature-badge">Instant Automation</div>
                <h3>Content Automation</h3>
                <p>Generate high-quality content at scale with our AI-powered automation engine.</p>
                <ul className="feature-list">
                  <li><CheckCircle2 size={18} /> AI Content Generation</li>
                  <li><CheckCircle2 size={18} /> Multi-Channel Publishing</li>
                  <li><CheckCircle2 size={18} /> Campaign Scheduling</li>
                  <li><CheckCircle2 size={18} /> SEO Optimization</li>
                </ul>
              </motion.div>

              <motion.div
                className="feature-card-large"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon-large">
                  <Target size={32} />
                </div>
                <div className="feature-badge">Complete Platform</div>
                <h3>All-in-One Dashboard</h3>
                <p>Manage everything from a single, intuitive dashboard with real-time insights and controls.</p>
                <ul className="feature-list">
                  <li><CheckCircle2 size={18} /> Unified Analytics View</li>
                  <li><CheckCircle2 size={18} /> Campaign Management</li>
                  <li><CheckCircle2 size={18} /> Performance Tracking</li>
                  <li><CheckCircle2 size={18} /> Custom Reports</li>
                </ul>
              </motion.div>

              <motion.div
                className="feature-card-large"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon-large">
                  <Sparkles size={32} />
                </div>
                <div className="feature-badge">99.8% Accuracy</div>
                <h3>Proven Results</h3>
                <p>Industry-leading accuracy in revenue predictions and content performance metrics.</p>
                <ul className="feature-list">
                  <li><CheckCircle2 size={18} /> 99.8% Prediction Accuracy</li>
                  <li><CheckCircle2 size={18} /> 10K+ Successful Campaigns</li>
                  <li><CheckCircle2 size={18} /> ROI Guaranteed</li>
                  <li><CheckCircle2 size={18} /> 24/7 Monitoring</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="features-detailed">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">MORE FEATURES</span>
              <h2 className="section-title">Built for Scale and Performance</h2>
            </div>

            <div className="features-grid">
              <motion.div
                className="feature-card-small"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Brain size={24} className="feature-icon-small" />
                <h4>Machine Learning</h4>
                <p>Advanced ML models that learn from your data and improve over time</p>
              </motion.div>

              <motion.div
                className="feature-card-small"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Shield size={24} className="feature-icon-small" />
                <h4>Enterprise Security</h4>
                <p>Bank-level encryption and compliance with SOC 2, GDPR, and HIPAA</p>
              </motion.div>

              <motion.div
                className="feature-card-small"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Clock size={24} className="feature-icon-small" />
                <h4>Real-time Updates</h4>
                <p>Get instant notifications and updates as events happen</p>
              </motion.div>

              <motion.div
                className="feature-card-small"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Globe size={24} className="feature-icon-small" />
                <h4>Global CDN</h4>
                <p>Lightning-fast performance with servers in 50+ locations worldwide</p>
              </motion.div>

              <motion.div
                className="feature-card-small"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Layers size={24} className="feature-icon-small" />
                <h4>API Access</h4>
                <p>Full REST API access for custom integrations and workflows</p>
              </motion.div>

              <motion.div
                className="feature-card-small"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Users size={24} className="feature-icon-small" />
                <h4>Team Collaboration</h4>
                <p>Work together with unlimited team members and role-based access</p>
              </motion.div>
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
              <TrendingUp size={48} className="cta-icon" />
              <h2>Ready to Transform Your Revenue?</h2>
              <p>Join 10,000+ businesses using SUBSTATE to optimize their revenue</p>
              <div className="cta-buttons">
                <Link to="/register" className="cta-primary">
                  Start Free Trial
                  <ArrowRight size={20} />
                </Link>
                <Link to="/services" className="cta-secondary">
                  View Services
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

export default Features
