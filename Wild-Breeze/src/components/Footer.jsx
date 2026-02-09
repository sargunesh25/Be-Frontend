
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
                <div className="payment-icons">
                    {/* Visa */}
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                        alt="Visa"
                        className="payment-icon"
                    />
                    {/* Mastercard */}
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                        alt="Mastercard"
                        className="payment-icon"
                    />
                    {/* PayPal */}
                    <img
                        src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/paypal.svg"
                        alt="PayPal"
                        className="payment-icon"
                    />
                    {/* RuPay */}
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/d/d1/RuPay.svg"
                        alt="RuPay"
                        className="payment-icon"
                    />
                    {/* UPI */}
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg"
                        alt="UPI"
                        className="payment-icon"
                    />
                    {/* Google Pay */}
                    <img
                        src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/googlepay.svg"
                        alt="Google Pay"
                        className="payment-icon"
                    />
                </div>
                <p className="copyright-text">
                    &copy; 2026, Wild breeze
                </p>
            </div>
        </div>
    );
};

export default Footer;
