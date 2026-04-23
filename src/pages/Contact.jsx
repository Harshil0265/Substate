import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  MessageCircle,
  Send,
  Sparkles,
  ArrowRight,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  HeadphonesIcon
} from 'lucide-react'
import Footer from '../components/Footer'
import useScrollAnimation from '../hooks/useScrollAnimation'
import '../styles/landing-pax.css'
import '../styles/pages.css'

function Contact() {
  // Initialize scroll animations
  useScrollAnimation()

  return (
    <>
      <Helmet>
        <title>Contact Us - SUBSTATE Revenue Intelligence Platform</title>
        <meta name="description" content="Get in touch with SUBSTATE. We're here to help you optimize your revenue with AI-powered intelligence." />
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
              <Link to="/about" className="nav-link">About</Link>
              <Link to="/contact" className="nav-link active">Contact</Link>
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
                <span>Get In Touch</span>
              </div>
              <h1 className="page-hero-title">We'd Love to Hear From You</h1>
              <p className="page-hero-subtitle">
                Have questions about SUBSTATE? Our team is here to help you optimize 
                your revenue with AI-powered intelligence.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Methods Section */}
        <section className="contact-methods-section">
          <div className="section-container">
            <div className="contact-methods-grid">
              <motion.div
                className="contact-method-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="contact-method-icon">
                  <Mail size={32} />
                </div>
                <h3>Email Us</h3>
                <p>Get in touch via email for detailed inquiries</p>
                <a href="mailto:support@substate.com" className="contact-method-link">
                  support@substate.com
                  <ArrowRight size={16} />
                </a>
              </motion.div>

              <motion.div
                className="contact-method-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="contact-method-icon">
                  <Phone size={32} />
                </div>
                <h3>Call Us</h3>
                <p>Speak directly with our support team</p>
                <a href="tel:+919664972848" className="contact-method-link">
                  +91 9664972848
                  <ArrowRight size={16} />
                </a>
              </motion.div>

              <motion.div
                className="contact-method-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="contact-method-icon">
                  <MessageCircle size={32} />
                </div>
                <h3>Live Chat</h3>
                <p>Chat with us in real-time for quick answers</p>
                <button className="contact-method-link" onClick={() => alert('Live chat coming soon!')}>
                  Start Chat
                  <ArrowRight size={16} />
                </button>
              </motion.div>

              <motion.div
                className="contact-method-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="contact-method-icon">
                  <HeadphonesIcon size={32} />
                </div>
                <h3>Support Center</h3>
                <p>Browse our help articles and guides</p>
                <a href="#" className="contact-method-link">
                  Visit Help Center
                  <ArrowRight size={16} />
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Main Contact Section */}
        <section className="main-contact-section">
          <div className="section-container">
            <div className="main-contact-grid">
              {/* Contact Information */}
              <motion.div
                className="contact-info-detailed"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2>Contact Information</h2>
                <p className="contact-info-subtitle">
                  Fill out the form and our team will get back to you within 24 hours.
                </p>

                <div className="contact-info-items">
                  <div className="contact-info-item">
                    <div className="contact-info-icon">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h4>Phone</h4>
                      <p>+91 9664972848</p>
                      <span className="contact-info-meta">Mon-Fri 9am-6pm IST</span>
                    </div>
                  </div>

                  <div className="contact-info-item">
                    <div className="contact-info-icon">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4>Email</h4>
                      <p>support@substate.com</p>
                      <span className="contact-info-meta">We'll respond within 24 hours</span>
                    </div>
                  </div>

                  <div className="contact-info-item">
                    <div className="contact-info-icon">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4>Office Address</h4>
                      <p>B-4 Sanidhya Tenament</p>
                      <p>Near C.H. Vidyalay, High Tension Road</p>
                      <p>Subhanpura, Samta</p>
                      <p>Vadodara - 390023, Gujarat, India</p>
                    </div>
                  </div>

                  <div className="contact-info-item">
                    <div className="contact-info-icon">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h4>Business Hours</h4>
                      <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p>Saturday: 10:00 AM - 4:00 PM</p>
                      <p>Sunday: Closed</p>
                      <span className="contact-info-meta">Indian Standard Time (IST)</span>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="contact-social">
                  <h4>Follow Us</h4>
                  <div className="contact-social-links">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="contact-social-link">
                      <Twitter size={20} />
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="contact-social-link">
                      <Linkedin size={20} />
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="contact-social-link">
                      <Facebook size={20} />
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="contact-social-link">
                      <Instagram size={20} />
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="contact-social-link">
                      <Youtube size={20} />
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                className="contact-form-container"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <form
                  className="contact-form-modern"
                  onSubmit={(e) => {
                    e.preventDefault()
                    alert('Thank you for your message! We will get back to you soon.')
                  }}
                >
                  <h3>Send us a Message</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name *</label>
                      <input 
                        type="text" 
                        id="firstName"
                        placeholder="First name" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name *</label>
                      <input 
                        type="text" 
                        id="lastName"
                        placeholder="Last name" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input 
                        type="email" 
                        id="email"
                        placeholder="your@email.com" 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input 
                        type="tel" 
                        id="phone"
                        placeholder="+91 9876543210" 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="company">Company Name</label>
                    <input 
                      type="text" 
                      id="company"
                      placeholder="Your Company" 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <input 
                      type="text" 
                      id="subject"
                      placeholder="How can we help you?" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea 
                      id="message"
                      placeholder="Tell us more about your inquiry..." 
                      rows="6" 
                      required
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" required />
                      <span>I agree to the privacy policy and terms of service *</span>
                    </label>
                  </div>

                  <button type="submit" className="contact-submit-modern">
                    <Send size={20} />
                    Send Message
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="map-section">
          <div className="section-container">
            <motion.div
              className="map-container"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="map-header">
                <MapPin size={24} />
                <h3>Find Us on Map</h3>
              </div>
              <div className="map-placeholder">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3691.6474089384!2d73.17!3d22.29!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395fc8ab91a3ddab%3A0x5f0c0c0c0c0c0c0c!2sSubhanpura%2C%20Vadodara%2C%20Gujarat%20390023!5e0!3m2!1sen!2sin!4v1234567890"
                  width="100%"
                  height="450"
                  style={{ border: 0, borderRadius: '16px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="SUBSTATE Office Location - Vadodara, Gujarat"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="contact-faq-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">FAQ</span>
              <h2 className="section-title">Frequently Asked Questions</h2>
            </div>

            <div className="faq-grid">
              <motion.div
                className="faq-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h4>What are your support hours?</h4>
                <p>Our support team is available Monday to Friday, 9:00 AM to 6:00 PM IST. We also offer limited support on Saturdays from 10:00 AM to 4:00 PM.</p>
              </motion.div>

              <motion.div
                className="faq-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h4>How quickly will I get a response?</h4>
                <p>We aim to respond to all inquiries within 24 hours during business days. Urgent matters are prioritized and typically receive responses within 4-6 hours.</p>
              </motion.div>

              <motion.div
                className="faq-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h4>Can I schedule a demo?</h4>
                <p>Yes! Contact us via phone or email to schedule a personalized demo of the SUBSTATE platform. We'll walk you through all features and answer your questions.</p>
              </motion.div>

              <motion.div
                className="faq-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h4>Do you offer enterprise support?</h4>
                <p>Yes, we offer dedicated enterprise support with priority response times, dedicated account managers, and 24/7 phone support for enterprise customers.</p>
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
              <Globe size={48} className="cta-icon" />
              <h2>Ready to Get Started?</h2>
              <p>Start your free trial today and see how SUBSTATE can transform your revenue</p>
              <div className="cta-buttons">
                <Link to="/register" className="cta-primary">
                  Start Free Trial
                  <ArrowRight size={20} />
                </Link>
                <Link to="/features" className="cta-secondary">
                  Explore Features
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

export default Contact
