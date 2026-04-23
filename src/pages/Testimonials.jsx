import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Star, 
  Quote, 
  TrendingUp, 
  Users, 
  Award,
  ArrowRight,
  Sparkles,
  Building2,
  MapPin
} from 'lucide-react'
import Footer from '../components/Footer'
import useScrollAnimation from '../hooks/useScrollAnimation'
import '../styles/landing-pax.css'
import '../styles/pages.css'

function Testimonials() {
  // Initialize scroll animations
  useScrollAnimation()

  const testimonials = [
    {
      name: 'Arjun Mehta',
      role: 'CEO',
      company: 'NexaVentures',
      location: 'Mumbai, Maharashtra',
      avatar: 'AM',
      rating: 5,
      category: 'Revenue Intelligence',
      result: '35% churn reduction',
      quote: "SUBSTATE's revenue intelligence platform transformed our business. We reduced churn by 35% in just 3 months and increased customer lifetime value by 50%. The AI predictions are incredibly accurate and have become essential to our decision-making process.",
      metrics: [
        { label: 'Churn Reduction', value: '35%' },
        { label: 'CLV Increase', value: '50%' },
        { label: 'Time to ROI', value: '3 months' }
      ]
    },
    {
      name: 'Priya Sharma',
      role: 'Marketing Director',
      company: 'GrowthLabs India',
      location: 'Bengaluru, Karnataka',
      avatar: 'PS',
      rating: 5,
      category: 'Content Automation',
      result: '400% traffic increase',
      quote: "The content automation is a game-changer. We went from publishing 10 articles per month to 300+ while maintaining quality. Our organic traffic increased by 400% in 6 months, and we've seen a 3x improvement in lead generation.",
      metrics: [
        { label: 'Content Output', value: '30x' },
        { label: 'Traffic Growth', value: '400%' },
        { label: 'Lead Generation', value: '3x' }
      ]
    },
    {
      name: 'Rahul Verma',
      role: 'Founder',
      company: 'StartupNest',
      location: 'Hyderabad, Telangana',
      avatar: 'RV',
      rating: 5,
      category: 'Full Platform',
      result: '20hrs/week saved',
      quote: "Best investment we've made this year. The revenue forecasting is spot-on, and the campaign automation saved us 20 hours per week. ROI was positive within the first month. The platform pays for itself many times over.",
      metrics: [
        { label: 'Time Saved', value: '20hrs/week' },
        { label: 'ROI Timeline', value: '1 month' },
        { label: 'Cost Savings', value: '₹50L/year' }
      ]
    },
    {
      name: 'Sneha Iyer',
      role: 'VP of Operations',
      company: 'DataPulse Technologies',
      location: 'Pune, Maharashtra',
      avatar: 'SI',
      rating: 5,
      category: 'Analytics',
      result: '99.8% accuracy',
      quote: "The analytics capabilities are unmatched. We can now predict customer behavior with 99.8% accuracy and make data-driven decisions in real-time. The platform has become the backbone of our revenue operations.",
      metrics: [
        { label: 'Prediction Accuracy', value: '99.8%' },
        { label: 'Decision Speed', value: 'Real-time' },
        { label: 'Revenue Impact', value: '+45%' }
      ]
    },
    {
      name: 'Vikram Nair',
      role: 'CMO',
      company: 'BrandReach',
      location: 'Chennai, Tamil Nadu',
      avatar: 'VN',
      rating: 5,
      category: 'Campaign Automation',
      result: '10x campaign volume',
      quote: "We scaled from 5 campaigns per month to 50+ without adding headcount. The automation is intelligent and the results speak for themselves. Our campaign ROI improved by 250% while reducing manual work by 80%.",
      metrics: [
        { label: 'Campaign Scale', value: '10x' },
        { label: 'ROI Improvement', value: '250%' },
        { label: 'Manual Work', value: '-80%' }
      ]
    },
    {
      name: 'Sarah Mitchell',
      role: 'Head of Growth',
      company: 'CloudVentures',
      location: 'London, UK',
      avatar: 'SM',
      rating: 5,
      category: 'Multi-Channel',
      result: '50+ integrations',
      quote: "The multi-channel publishing capabilities are phenomenal. We publish to 50+ channels simultaneously and track performance across all of them. This unified approach increased our reach by 500% and engagement by 300%.",
      metrics: [
        { label: 'Channel Reach', value: '50+' },
        { label: 'Audience Growth', value: '500%' },
        { label: 'Engagement', value: '+300%' }
      ]
    }
  ]

  const stats = [
    { icon: <Users size={32} />, value: '10,000+', label: 'Happy Customers' },
    { icon: <Star size={32} />, value: '4.9/5', label: 'Average Rating' },
    { icon: <TrendingUp size={32} />, value: '300%', label: 'Avg ROI Increase' },
    { icon: <Award size={32} />, value: '99.8%', label: 'Satisfaction Rate' }
  ]

  return (
    <>
      <Helmet>
        <title>Testimonials - SUBSTATE Success Stories</title>
        <meta name="description" content="Read success stories from businesses using SUBSTATE to optimize revenue, automate content, and grow faster." />
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
              <Link to="/testimonials" className="nav-link active">Testimonials</Link>
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
                <span>Success Stories</span>
              </div>
              <h1 className="page-hero-title">Trusted by Thousands of Growing Businesses</h1>
              <p className="page-hero-subtitle">
                Don't just take our word for it. Here's what our clients say about their 
                experience with SUBSTATE and the results they've achieved.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="testimonial-stats-section">
          <div className="section-container">
            <div className="testimonial-stats-grid">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="testimonial-stat-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="testimonials-detailed-section">
          <div className="section-container">
            <div className="testimonials-detailed-grid">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="testimonial-detailed-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="testimonial-detailed-header">
                    <Quote size={32} className="quote-icon" />
                    <div className="testimonial-rating">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                    </div>
                  </div>

                  <p className="testimonial-detailed-quote">"{testimonial.quote}"</p>

                  <div className="testimonial-metrics">
                    {testimonial.metrics.map((metric, idx) => (
                      <div key={idx} className="metric-item">
                        <div className="metric-value">{metric.value}</div>
                        <div className="metric-label">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="testimonial-detailed-author">
                    <div className="author-avatar-large">{testimonial.avatar}</div>
                    <div className="author-details">
                      <div className="author-name">{testimonial.name}</div>
                      <div className="author-role">{testimonial.role}</div>
                      <div className="author-company">
                        <Building2 size={14} />
                        <span>{testimonial.company}</span>
                      </div>
                      <div className="author-location">
                        <MapPin size={14} />
                        <span>{testimonial.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="testimonial-badges">
                    <span className="testimonial-badge">{testimonial.category}</span>
                    <span className="testimonial-result">{testimonial.result}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Video Testimonials Section */}
        <section className="video-testimonials-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">VIDEO TESTIMONIALS</span>
              <h2 className="section-title">Hear From Our Customers</h2>
              <p className="section-subtitle">Watch real stories from businesses that transformed their revenue with SUBSTATE</p>
            </div>

            <div className="video-testimonials-grid">
              {[1, 2, 3].map((video, index) => (
                <motion.div
                  key={index}
                  className="video-testimonial-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="video-placeholder">
                    <div className="play-button">▶</div>
                  </div>
                  <h4>Success Story #{video}</h4>
                  <p>How we achieved 300% ROI in 6 months</p>
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
              <Sparkles size={48} className="cta-icon" />
              <h2>Ready to Write Your Success Story?</h2>
              <p>Join 10,000+ businesses who have successfully optimized their revenue with SUBSTATE</p>
              <div className="cta-buttons">
                <Link to="/register" className="cta-primary">
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

        <Footer />
      </div>
    </>
  )
}

export default Testimonials
