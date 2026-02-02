
import React from 'react';
import './ProductGrid.css';

const products = [
    {
        id: 1,
        title: 'Teddy Bear Crew',
        price: '$45.00 USD',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Clothes placeholder
    },
    {
        id: 2,
        title: 'Sardine Crew',
        price: '$35.00 USD',
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Clothes placeholder
    },
    {
        id: 3,
        title: 'Flower Bouquet Crew',
        price: '$49.00 USD',
        image: '/assets/flower-bouquet.png',
    },
    {
        id: 4,
        title: 'Sardine Boxy Tee',
        price: '$25.00 USD',
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Clothes placeholder
    },
];

const ProductGrid = () => {
    return (
        <div className="product-section">
            <h2 className="section-title">Looking for something cozy?</h2>

            <div className="product-grid">
                {products.map((product) => (
                    <div key={product.id} className="product-card">
                        <div className="product-image-container">
                            <img src={product.image} alt={product.title} className="product-image" />
                        </div>
                        <div className="product-title">{product.title}</div>
                        <div className="product-price">{product.price}</div>
                    </div>
                ))}
            </div>

            <button className="view-all-btn">View all</button>
        </div>
    );
};

export default ProductGrid;
