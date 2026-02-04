import React from 'react';
import './Contact.css';

const Contact = () => {

    return (
        <div className="contact-page">
            <div className="contact-container">
                <h1 className="contact-title">Contact</h1>

                <div className="contact-content">
                    <p className="contact-text">
                        All orders placed after 8/13 will not ship until the week of 8/25. We appreciate your patience and understanding!
                    </p>

                    <p className="contact-email-section">
                        Please email us at <a href="mailto:help@wildbreeze.shop" className="email-link">help@wildbreeze.shop</a>
                    </p>


                    <p className="contact-note">
                        Please remember to include your full name and order number so we can best assist you. Thank you!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Contact;
