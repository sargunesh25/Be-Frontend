import React, { useState, useEffect } from 'react';
import './Hero.css';
import { getHeroSlides } from '../services/api';

const Hero = ({ setPromoText = () => { } }) => {
    const [showWidget, setShowWidget] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [slides, setSlides] = useState([]);

    useEffect(() => {
        const fetchSlides = async () => {
            const data = await getHeroSlides();
            // Transform data if needed to match component expectations
            // API returns: { image_url, promo_text }
            // Component expects: { image, promo }
            const mappedSlides = data.map(s => ({
                image: s.image_url,
                promo: s.promo_text,
                title: s.title,
                subtitle: s.subtitle
            }));
            setSlides(mappedSlides);
        };
        fetchSlides();
    }, []);

    useEffect(() => {
        if (slides.length === 0) return;

        const interval = setInterval(() => {
            setIsTransitioning(true);
            const nextIndex = (currentIndex + 1) % slides.length;
            setPromoText(slides[nextIndex].promo);

            setTimeout(() => {
                setCurrentIndex(nextIndex);
                setIsTransitioning(false);
            }, 1000);

        }, 5000);

        return () => clearInterval(interval);
    }, [currentIndex, slides, setPromoText]);

    const getSlideClass = (index) => {
        if (index === currentIndex && !isTransitioning) return 'slide-active';
        if (index === currentIndex && isTransitioning) return 'slide-exit';

        const nextIndex = (currentIndex + 1) % slides.length;
        if (index === nextIndex && isTransitioning) return 'slide-active';

        return 'slide-waiting';
    };

    if (slides.length === 0) return null; // Or a loading skeleton

    return (
        <div className="hero-wrapper">
            <div className="hero-container">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`hero-slide ${getSlideClass(index)}`}
                        style={{ backgroundImage: `url('${slide.image}')` }}
                    >
                        <div className="hero-card">
                            <h2 className="hero-title">{slide.title || 'Welcome'}</h2>
                            <p className="hero-subtitle">{slide.subtitle || 'Discover our new collection'}</p>
                            <button
                                className="shop-now-btn"
                                onClick={() => {
                                    const section = document.getElementById('product-section');
                                    if (section) {
                                        section.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                            >
                                shop now!
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showWidget && (
                <div style={{ display: 'none' }}></div>
            )}
        </div>
    );
};

export default Hero;
