import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Wind } from 'lucide-react';
import './DiscountModal.css';
import { subscribeUser } from '../services/api';
import { countries } from '../data/countries';

const DiscountModal = ({ isOpen, onClose }) => {
    const [phone, setPhone] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.name === "India") || countries[2]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    if (!isOpen) return null;

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setPhone(value);
        }
    };

    const handleCountrySelect = (country) => {
        setSelectedCountry(country);
        setIsDropdownOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const fullNumber = selectedCountry.dial_code + phone;
            await subscribeUser(fullNumber);
            localStorage.setItem('hasDiscount', 'true');
            alert(`Discount Activated! You can now shop as a guest.`);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to subscribe. Please try again.');
        }
    };

    return (
        <div className="discount-modal-overlay">
            <div className="discount-modal">
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="discount-content">
                    <div className="discount-logo">
                        <Wind size={32} className="title-icon" />
                        <span>Wild breeze</span>
                    </div>

                    <p className="welcome-text">I'm so happy you're here!</p>
                    <h2 className="offer-text">SAVE 10%</h2>
                    <p className="sub-text">On your order when you subscribe!</p>

                    <form onSubmit={handleSubmit} className="discount-form">
                        <div className={`phone-input-group ${isFocused || phone ? 'focused' : ''}`}>
                            <label className="phone-label">What is your phone number?</label>

                            <div className="input-row">
                                <div
                                    className="country-trigger"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <img src={selectedCountry.flag} alt={selectedCountry.code} className="flag-icon" />
                                    <span className="dial-code">{selectedCountry.dial_code}</span>
                                    {isDropdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}

                                    {isDropdownOpen && (
                                        <div className="country-dropdown">
                                            {countries.map((country) => (
                                                <div
                                                    key={country.code}
                                                    className="country-option"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCountrySelect(country);
                                                    }}
                                                >
                                                    <img src={country.flag} alt={country.code} className="flag-icon-small" />
                                                    <span className="country-name">{country.name}</span>
                                                    <span className="country-dial">{country.dial_code}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    className="phone-input"
                                />
                            </div>
                        </div>

                        <p className="legal-text">
                            *By providing your number and clicking the button, you agree to receive recurring auto-dialed marketing SMS (including cart reminders; 1 message/week). Consent is not required to purchase. Msg & data rates may apply. Msg frequency varies. Reply HELP for help, STOP to opt out. View <a href="#">PRIVACY POLICY</a>.
                        </p>

                        <button type="submit" className="signup-btn">Sign Up</button>
                        <button type="button" className="nothanks-btn" onClick={onClose}>No Thanks</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DiscountModal;
