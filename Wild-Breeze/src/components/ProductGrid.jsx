import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import './ProductGrid.css';
import { getProducts } from '../services/api';
import { useCart } from '../context/CartContext';

const ProductGrid = ({ title = "Looking for something cozy?" }) => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            const data = await getProducts(); // No filters for default home view
            // Show only first 4 items for the grid/home view
            setProducts(data.slice(0, 5));
        };
        fetchProducts();
    }, []);

    const { addToCart } = useCart();

    const handleAddToCart = (product) => {
        addToCart(product);
    };

    return (
        <div className="product-section">
            <h2 className="section-title">{title}</h2>

            <div className="product-grid">
                {products.map((product) => (
                    <div key={product.id} className="product-card">
                        <div className="product-image-container">
                            <img src={product.image_url || 'https://via.placeholder.com/300'} alt={product.title} className="product-image" />

                            <div
                                className="cart-icon-overlay"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(product);
                                }}
                            >
                                <span className="add-text">Add to Cart</span>
                                <ShoppingBag size={18} />
                            </div>
                        </div>
                        <div className="product-title">{product.title}</div>
                        <div className="product-price">${product.price}</div>
                    </div>
                ))}
            </div>

            <button className="view-all-btn">View all</button>
        </div>
    );
};

export default ProductGrid;
