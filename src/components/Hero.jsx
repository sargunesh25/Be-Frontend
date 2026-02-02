
import React, { useState } from 'react';
import './Hero.css';

const Hero = () => {
    const [showWidget, setShowWidget] = useState(true);

    return (
        <div className="hero-wrapper">
            <div className="hero-container">
                <div className="hero-card">
                    <h2 className="hero-title">Looking for something cozy?</h2>
                    <p className="hero-subtitle">New arrivals are here!</p>
                    <button className="shop-now-btn">shop now!</button>
                </div>
            </div>

            {showWidget && (
                <div className="discount-widget">
                    <div className="close-btn" onClick={(e) => {
                        e.stopPropagation();
                        setShowWidget(false);
                    }}>x</div>
                    GET 10% OFF
                </div>
            )}
        </div>
    );
};

export default Hero;
