import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Target, 
  Bot, 
  Smartphone, 
  TrendingUp, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Clock,
  Users,
  Award,
  Sparkles
} from 'lucide-react'
import Footer from '../components/Footer'
import useScrollAnimation from '../hooks/useScrollAnimation'
import '../styles/landing-pax.css'
import '../styles/pages.css'

function Services() {
  // Initialize scroll animations
  useScrollAnimation()

  const services = [
    {
      icon: <BarChart3 size={32} />,
      title: 'Customer Analytics',
      description: 'Deep insights into customer behavior, lifetime value, and engagement patterns with real-time tracking and predictive analytics.',
      features: [
        'Customer Lifetime Value (CLV) Tracking',
        'Behavioral Pattern Analysis',
        'Engagement Metrics Dashboard',
        'Cohort Analysis & Segmentation',
        'Real-time Activity Monitoring',
        'Custom Report Generation'
      ],
      stats: {
        accuracy: '99.8% Accuracy',
        speed: 'Real-time tracking',
        users: '10K+ Active Users'
      }
    },
    {
      icon: <Target size={32} />,
      title: 'Churn Prediction',
      description: 'AI-powered models predict customer churn before it happens, allowing you to take proactive retention measures.',
      features: [
        'Advanced ML Churn Models',
        'Risk Score Calculation',
        'Early Warning Alerts',
        'Retention Strategy Recommendations',
        'Historical Trend Analysis',
        'Automated Intervention Triggers'
      ],
      stats: {
        accuracy: '95% Prediction Rate',
        speed: 'Daily updates',
        users: '5K+ Saved Customers'
      }
    },
    {
      icon: <Bot size={32} />,
      title: 'AI Content Engine',
      description: 'Generate high-quality, SEO-optimized content automatically with our advanced AI engine powered by GPT-4.',
      features: [
        'AI-Powered Content Generation',
        'SEO Optimization Built-in',
        'Multiple Content Formats',
        'Brand Voice Customization',
        'Plagiarism Detection',
        'Multi-language Support'
      ],
      stats: {
        accuracy: '10K+ Articles/Month',
        speed: 'Instant generation',
        users: '50K+ Content Pieces'
      }
    },
    {
      icon: <Smartphone size={32} />,
      title: 'Multi-Channel Publishing',
      description: 'Publish content seamlessly across WordPress, social media platforms, and more with one-click distribution.',
      features: [
        'WordPress Integration',
        'Social Media Auto-posting',
        'Email Campaign Distribution',
        'Content Scheduling',
        'Cross-platform Analytics',
        'Custom Webhook Support'
      ],
      stats: {
        accuracy: '50+ Integrations',
        speed: 'One-click publish',
        users: '100K+ Posts Published'
      }
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Revenue Forecasting',
      description: 'Predict future revenue with machine learning models trained on your historical data and market trends.',
      features: [
        'ML-based Revenue Predictions',
        'Scenario Planning Tools',
        'Market Trend Analysis',
        'Growth Opportunity Identification',
        'Budget Planning Support',
        'Quarterly & Annual Forecasts'
      ],
      stats: {
        accuracy: '92% Accuracy',
        speed: 'Monthly forecasts',
        users: '₹500Cr+ Forecasted'
      }
    },
    {
      icon: <Zap size={32} />,
      title: 'Campaign Automation',
      description: 'Automate your entire marketing campaign workflow from creation to analysis with intelligent automation.',
      features: [
        'End-to-end Campaign Automation',
        'A/B Testing Framework',
        'Performance Optimization',
        'Automated Reporting',
        'Budget Management',
        'ROI Tracking'
      ],
      stats: {
        accuracy: '5K+ Campaigns',
        speed: '24/7 automation',
        users: '300% Avg ROI'
      }
    }
  ]

  return (
    <>
      <Helmet>
        <title>Services - SUBSTATE Revenue Intelligence Platform</title>
        <meta name="description" content="Explore our comprehensive revenue optimization services including analytics, churn prediction, content automation, and more." />
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
              <Link to="/services" className="nav-link active">Services</Link>
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
                <span>Our Services</span>
              </div>
              <h1 className="page-hero-title">Comprehensive Revenue Solutions</h1>
              <p className="page-hero-subtitle">
                Powerful services tailored to your revenue optimization needs with proven results 
                and industry-leading accuracy.
              </p>
              <div className="page-hero-cta">
                <Link to="/register" className="cta-primary-autopilot">
                  Start Free Trial
                  <ArrowRight size={20} />
                </Link>
                <Link to="/features" className="cta-secondary">
                  View Features
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="services-detailed-section">
          <div className="section-container">
            {services.map((service, index) => (
              <motion.div
                key={index}
                className="service-detailed-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="service-detailed-header">
                  <div className="service-detailed-icon">
                    {service.icon}
                  </div>
                  <div className="service-detailed-title-section">
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </div>
                </div>

                <div className="service-detailed-content">
                  <div className="service-features-list">
                    <h4>Key Features</h4>
                    <ul>
                      {service.features.map((feature, idx) => (
                        <li key={idx}>
                          <CheckCircle2 size={18} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="service-stats">
                    <div className="stat-item">
                      <Award size={20} />
                      <span>{service.stats.accuracy}</span>
                    </div>
                    <div className="stat-item">
                      <Clock size={20} />
                      <span>{service.stats.speed}</span>
                    </div>
                    <div className="stat-item">
                      <Users size={20} />
                      <span>{service.stats.users}</span>
                    </div>
                  </div>
                </div>

                <div className="service-detailed-footer">
                  <Link to="/register" className="service-cta-button">
                    Get Started
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why Choose Our Services */}
        <section className="why-services-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">WHY CHOOSE US</span>
              <h2 className="section-title">Built for Your Success</h2>
            </div>

            <div className="why-services-grid">
              <motion.div
                className="why-service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Award size={32} />
                <h4>Industry Leading</h4>
                <p>99.8% accuracy rate with proven results across 10,000+ businesses</p>
              </motion.div>

              <motion.div
                className="why-service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Clock size={32} />
                <h4>24/7 Automation</h4>
                <p>Round-the-clock monitoring and automation that never sleeps</p>
              </motion.div>

              <motion.div
                className="why-service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Users size={32} />
                <h4>Expert Support</h4>
                <p>Dedicated support team available to help you succeed</p>
              </motion.div>

              <motion.div
                className="why-service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Zap size={32} />
                <h4>Fast Implementation</h4>
                <p>Get up and running in minutes, not months</p>
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
              <Sparkles size={48} className="cta-icon" />
              <h2>Ready to Get Started?</h2>
              <p>Join thousands of businesses optimizing their revenue with SUBSTATE</p>
              <div className="cta-buttons">
                <Link to="/register" className="cta-primary">
                  Start Free Trial
                  <ArrowRight size={20} />
                </Link>
                <Link to="/testimonials" className="cta-secondary">
                  Read Success Stories
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

export default Services
