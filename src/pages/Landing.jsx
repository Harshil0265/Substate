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
import useScrollAnimation from '../hooks/useScrollAnimation'
import '../styles/landing-pax.css'
import '../styles/footer.css'

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Initialize scroll animations
  useScrollAnimation()

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
        {/* Professional Navigation */}
        <nav className="landing-nav">
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
                AI-powered platform that predicts churn, automates content, and maximizes revenue 24/7
              </p>

              <div className="hero-cta-autopilot">
                <Link to="/login" className="cta-text-link">
                  Sign In
                </Link>
                <Link to="/register" className="cta-primary-autopilot">
                  Start free trial
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="trust-section">
          <div className="section-container">
            <div className="trust-grid">
              <motion.div 
                className="trust-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="trust-number">10K+</div>
                <div className="trust-label">Active Users</div>
              </motion.div>
              <motion.div 
                className="trust-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="trust-number">50K+</div>
                <div className="trust-label">Content Generated</div>
              </motion.div>
              <motion.div 
                className="trust-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="trust-number">99.8%</div>
                <div className="trust-label">Accuracy Rate</div>
              </motion.div>
              <motion.div 
                className="trust-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="trust-number">10+</div>
                <div className="trust-label">Years Experience</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="features-section" id="features">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">WHY CHOOSE SUBSTATE</span>
              <h2 className="section-title">Everything You Need for Revenue Growth</h2>
              <p className="section-subtitle">
                From AI-powered analytics to automated content creation, we provide comprehensive 
                tools to make your revenue optimization journey smooth and successful.
              </p>
            </div>

            <div className="features-grid-large">
              <motion.div
                className="feature-card-large"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon-large"><BarChart3 size={32} /></div>
                <div className="feature-badge">AI-Powered Analytics</div>
                <h3>Revenue Intelligence</h3>
                <p>Advanced AI algorithms analyze customer behavior, predict churn, and identify revenue opportunities in real-time.</p>
                <ul className="feature-list">
                  <li><CheckCircle2 size={18} /> Customer Lifetime Value Tracking</li>
                  <li><CheckCircle2 size={18} /> Churn Prediction Models</li>
                  <li><CheckCircle2 size={18} /> Revenue Forecasting</li>
                </ul>
              </motion.div>

              <motion.div
                className="feature-card-large"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon-large"><Zap size={32} /></div>
                <div className="feature-badge">Instant Automation</div>
                <h3>Content Automation</h3>
                <p>Generate high-quality content at scale with our AI-powered automation engine.</p>
                <ul className="feature-list">
                  <li><CheckCircle2 size={18} /> AI Content Generation</li>
                  <li><CheckCircle2 size={18} /> Multi-Channel Publishing</li>
                  <li><CheckCircle2 size={18} /> Campaign Scheduling</li>
                </ul>
              </motion.div>

              <motion.div
                className="feature-card-large"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon-large"><Target size={32} /></div>
                <div className="feature-badge">Complete Platform</div>
                <h3>All-in-One Dashboard</h3>
                <p>Manage everything from a single, intuitive dashboard with real-time insights and controls.</p>
                <ul className="feature-list">
                  <li><CheckCircle2 size={18} /> Unified Analytics View</li>
                  <li><CheckCircle2 size={18} /> Campaign Management</li>
                  <li><CheckCircle2 size={18} /> Performance Tracking</li>
                </ul>
              </motion.div>

              <motion.div
                className="feature-card-large"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon-large"><Sparkles size={32} /></div>
                <div className="feature-badge">99.8% Accuracy</div>
                <h3>Proven Results</h3>
                <p>Industry-leading accuracy in revenue predictions and content performance metrics.</p>
                <ul className="feature-list">
                  <li><CheckCircle2 size={18} /> 99.8% Prediction Accuracy</li>
                  <li><CheckCircle2 size={18} /> 10K+ Successful Campaigns</li>
                  <li><CheckCircle2 size={18} /> ROI Guaranteed</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="services-section" id="services">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">OUR PLATFORM</span>
              <h2 className="section-title">Comprehensive Revenue Solutions</h2>
              <p className="section-subtitle">
                Powerful features tailored to your revenue optimization needs with proven results
              </p>
            </div>

            <div className="services-grid">
              <motion.div
                className="service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="service-icon"><BarChart3 size={32} /></div>
                <h3>Customer Analytics</h3>
                <p>Deep insights into customer behavior, lifetime value, and engagement patterns</p>
                <div className="service-meta">
                  <span className="service-success"><Award size={16} /> 99.8% Accuracy</span>
                  <span className="service-time"><Clock size={16} /> Real-time tracking</span>
                </div>
                <Link to="/services" className="service-link">
                  Learn More <ArrowRight size={16} />
                </Link>
              </motion.div>

              <motion.div
                className="service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="service-icon"><Target size={32} /></div>
                <h3>Churn Prediction</h3>
                <p>AI-powered models predict customer churn before it happens</p>
                <div className="service-meta">
                  <span className="service-success"><Award size={16} /> 95% Prediction Rate</span>
                  <span className="service-time"><Clock size={16} /> Daily updates</span>
                </div>
                <Link to="/services" className="service-link">
                  Learn More <ArrowRight size={16} />
                </Link>
              </motion.div>

              <motion.div
                className="service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="service-icon"><Bot size={32} /></div>
                <h3>AI Content Engine</h3>
                <p>Generate high-quality content automatically with advanced AI</p>
                <div className="service-meta">
                  <span className="service-success"><Award size={16} /> 10K+ Articles/Month</span>
                  <span className="service-time"><Clock size={16} /> Instant generation</span>
                </div>
                <Link to="/services" className="service-link">
                  Learn More <ArrowRight size={16} />
                </Link>
              </motion.div>

              <motion.div
                className="service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="service-icon"><Smartphone size={32} /></div>
                <h3>Multi-Channel Publishing</h3>
                <p>Publish content across WordPress, social media, and more</p>
                <div className="service-meta">
                  <span className="service-success"><Award size={16} /> 50+ Integrations</span>
                  <span className="service-time"><Clock size={16} /> One-click publish</span>
                </div>
                <Link to="/services" className="service-link">
                  Learn More <ArrowRight size={16} />
                </Link>
              </motion.div>

              <motion.div
                className="service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <div className="service-icon"><TrendingUp size={32} /></div>
                <h3>Revenue Forecasting</h3>
                <p>Predict future revenue with machine learning models</p>
                <div className="service-meta">
                  <span className="service-success"><Award size={16} /> 92% Accuracy</span>
                  <span className="service-time"><Clock size={16} /> Monthly forecasts</span>
                </div>
                <Link to="/services" className="service-link">
                  Learn More <ArrowRight size={16} />
                </Link>
              </motion.div>

              <motion.div
                className="service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="service-icon"><Zap size={32} /></div>
                <h3>Campaign Automation</h3>
                <p>Automate your entire marketing campaign workflow</p>
                <div className="service-meta">
                  <span className="service-success"><Award size={16} /> 5K+ Campaigns</span>
                  <span className="service-time"><Clock size={16} /> 24/7 automation</span>
                </div>
                <Link to="/services" className="service-link">
                  Learn More <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>

            <div className="services-cta">
              <Link to="/register" className="cta-primary">
                Start Free Trial
              </Link>
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
                  <div className="author-avatar">JD</div>
                  <div className="author-info">
                    <div className="author-name">John Doe</div>
                    <div className="author-title">CEO • TechCorp</div>
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
                  <div className="author-avatar">SM</div>
                  <div className="author-info">
                    <div className="author-name">Sarah Miller</div>
                    <div className="author-title">Marketing Director • GrowthLabs</div>
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
                  <div className="author-avatar">RK</div>
                  <div className="author-info">
                    <div className="author-name">Robert Kim</div>
                    <div className="author-title">Founder • StartupHub</div>
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
                    <span className="price-currency">$</span>
                    <span className="price-amount">29</span>
                    <span className="price-period">/month</span>
                  </div>
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
                    <span className="price-currency">$</span>
                    <span className="price-amount">79</span>
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
                    <span className="price-currency">$</span>
                    <span className="price-amount">199</span>
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
                <Link to="/register" className="pricing-button">Contact Sales</Link>
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
                    <input type="text" id="name" placeholder="John Doe" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input type="email" id="email" placeholder="john@example.com" required />
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
