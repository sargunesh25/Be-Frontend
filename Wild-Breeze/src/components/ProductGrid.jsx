import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
            <h2 className="product-grid-title">{title}</h2>

            <div className="product-grid">
                {products.map((product) => (
                    <Link to={`/product/${product.id}`} key={product.id} className="product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="product-image-container">
                            <img src={product.image_url || 'https://via.placeholder.com/300'} alt={product.title} className="product-image" />
                        </div>
                        <div className="product-title">{product.title}</div>
                        <div className="product-price">${product.price}</div>
                    </Link>
                ))}
            </div>

            <button className="view-all-btn">View all</button>
        </div>
    );
};

export default ProductGrid;
