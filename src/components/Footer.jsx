import { Link } from 'react-router-dom'
import { 
  Mail, 
  MapPin, 
  Phone, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Instagram,
  Youtube,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import '../styles/footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="landing-footer-modern">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Brand Section */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src="/substate-icon.svg" alt="SUBSTATE" className="footer-logo-image" />
              <span className="footer-logo-text">SUBSTATE</span>
            </Link>
            <p className="footer-tagline">
              AI-powered revenue intelligence platform that predicts churn, automates content, 
              and maximizes revenue 24/7.
            </p>
            <div className="footer-social">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="YouTube">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="footer-links">
            <h4 className="footer-links-title">Product</h4>
            <ul className="footer-links-list">
              <li><Link to="/features" className="footer-link">Features</Link></li>
              <li><Link to="/services" className="footer-link">Services</Link></li>
              <li><Link to="/testimonials" className="footer-link">Testimonials</Link></li>
              <li><Link to="/about" className="footer-link">About Us</Link></li>
              <li><Link to="/contact" className="footer-link">Contact</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="footer-links">
            <h4 className="footer-links-title">Resources</h4>
            <ul className="footer-links-list">
              <li><a href="#" className="footer-link">Documentation</a></li>
              <li><a href="#" className="footer-link">API Reference</a></li>
              <li><a href="#" className="footer-link">Help Center</a></li>
              <li><a href="#" className="footer-link">Blog</a></li>
              <li><a href="#" className="footer-link">Case Studies</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="footer-links">
            <h4 className="footer-links-title">Company</h4>
            <ul className="footer-links-list">
              <li><Link to="/about" className="footer-link">About</Link></li>
              <li><Link to="/contact" className="footer-link">Contact</Link></li>
              <li><a href="#" className="footer-link">Careers</a></li>
              <li><a href="#" className="footer-link">Press Kit</a></li>
              <li><a href="#" className="footer-link">Partners</a></li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="footer-newsletter">
            <h4 className="footer-links-title">Stay Updated</h4>
            <p className="footer-newsletter-text">
              Get the latest updates on revenue intelligence and AI automation.
            </p>
            <form className="footer-newsletter-form" onSubmit={(e) => {
              e.preventDefault()
              alert('Thank you for subscribing!')
            }}>
              <div className="newsletter-input-wrapper">
                <Mail size={18} className="newsletter-icon" />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="newsletter-input"
                  required
                />
              </div>
              <button type="submit" className="newsletter-button">
                Subscribe
                <ArrowRight size={16} />
              </button>
            </form>
            <div className="footer-trust-badge">
              <Sparkles size={16} />
              <span>Trusted by 10,000+ businesses</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="footer-copyright">
              <p>&copy; 2026 SUBSTATE. All rights reserved.</p>
            </div>
            <div className="footer-legal">
              <a href="#" className="footer-legal-link">Privacy Policy</a>
              <span className="footer-divider">•</span>
              <a href="#" className="footer-legal-link">Terms of Service</a>
              <span className="footer-divider">•</span>
              <a href="#" className="footer-legal-link">Cookie Policy</a>
              <span className="footer-divider">•</span>
              <a href="#" className="footer-legal-link">GDPR</a>
            </div>
            <div className="footer-contact-info">
              <div className="footer-contact-item">
                <Phone size={14} />
                <span>+91 9664972848</span>
              </div>
              <div className="footer-contact-item">
                <Mail size={14} />
                <span>support@substate.com</span>
              </div>
              <div className="footer-contact-item">
                <MapPin size={14} />
                <span>Vadodara, Gujarat</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </footer>
  )
}

export default Footer
