
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    const location = useLocation();
    if (location.pathname === '/checkout') return null;

    return (
        <div className="footer-section">
            <h2 className="footer-heading">Join our mailing list!</h2>
            <p className="footer-subtext">
                Subscribe to our mailing list for insider news, product launches, and more.
            </p>

            <div className="email-form">
                <input
                    type="email"
                    placeholder="Email"
                    className="email-input"
                />
                <button className="email-submit">
                    <ArrowRight size={20} strokeWidth={1.5} />
                </button>
            </div>

            <h3 className="links-heading">Links</h3>
            <div className="footer-links">
                <a href="#" className="footer-link">Search</a>
                <a href="#" className="footer-link">Contact</a>
                <a href="#" className="footer-link">Wholesale</a>
                <a href="#" className="footer-link">Brand Feature</a>
            </div>

            <div className="footer-bottom">
                {/* Placeholder for payment icons - using a generic image URL or similar representation */}
                <img
                    src="https://cdn.shopify.com/s/files/1/0458/5727/6068/files/payment_icons.png?v=1613666248"
                    alt="Payment Methods"
                    className="payment-icons" // Changed in CSS to be fully opaque
                />
                <p className="copyright-text">
                    &copy; 2026, Wild breeze
                </p>
            </div>
        </div>
    );
};

export default Footer;
