
import React from 'react';
import './CategorySplit.css';

const CategorySplit = () => {
    return (
        <div className="category-split-section">
            <div className="category-grid">
                {/* Women */}
                <div className="category-item">
                    <img
                        src="/assets/woman-category-updated.png"
                        alt="Women's Fashion"
                        className="category-image"
                    />
                    <div className="category-content">
                        <h2 className="category-title">Women</h2>
                        <button className="category-btn">Shop now</button>
                    </div>
                </div>

                {/* Men */}
                <div className="category-item">
                    <img
                        src="/assets/man-category.png"
                        alt="Men's Fashion"
                        className="category-image"
                    />
                    <div className="category-content">
                        <h2 className="category-title">Men</h2>
                        <button className="category-btn">Shop now</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategorySplit;
