
import React from 'react';
import { ArrowRight } from 'lucide-react';
import './FeatureSection.css';

const FeatureSection = () => {
    return (
        <div className="feature-section">
            <h2 className="feature-title">New corded crews are coming soon!</h2>

            <div className="feature-grid">
                {/* Left Card with Link */}
                <div className="feature-card">
                    <img
                        src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                        alt="Woman in green sweatshirt"
                        className="feature-image"
                    />
                    <div className="feature-content">
                        <div className="feature-text-box">
                            <span className="feature-link-text">
                                Script Crews <ArrowRight size={18} className="arrow-icon" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Image Stack */}
                <div className="feature-card">
                    <img
                        src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                        alt="Stack of folded sweatshirts"
                        className="right-feature-image"
                    />
                </div>
            </div>
        </div>
    );
};

export default FeatureSection;
