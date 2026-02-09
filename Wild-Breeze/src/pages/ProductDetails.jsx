import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { getProduct } from '../services/api';
import { useCart } from '../context/CartContext';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('M'); // Default to M
    const [selectedColor, setSelectedColor] = useState('');
    const [validationError, setValidationError] = useState('');
    const { addToCart } = useCart();

    // Accordion states
    const [openAccordion, setOpenAccordion] = useState(null);

    // Available options
    const sizes = ['S', 'M', 'L', 'XL', '2XL'];
    const colors = ['Cream', 'Sea Foam', 'Navy'];

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            const data = await getProduct(id);
            setProduct(data);
            setLoading(false);

            // Set default color to first available color
            if (colors.length > 0 && !selectedColor) {
                setSelectedColor(colors[0]);
            }
        };
        fetchProduct();
    }, [id]);

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const handleAddToCart = () => {
        // Validate selections
        if (!selectedSize) {
            setValidationError('Please select a size');
            return;
        }
        if (!selectedColor) {
            setValidationError('Please select a color');
            return;
        }

        // Clear any validation error
        setValidationError('');

        if (product) {
            // Add to cart with selected options
            addToCart({
                ...product,
                selectedSize,
                selectedColor,
            }, quantity);
        }
    };

    const toggleAccordion = (section) => {
        setOpenAccordion(openAccordion === section ? null : section);
    };

    if (loading) {
        return (
            <div className="product-details-container">
                <div className="product-details-grid">
                    {/* Skeleton: Image Gallery */}
                    <div className="product-gallery">
                        <div className="main-image-wrapper skeleton-box" style={{ aspectRatio: '1/1', background: '#f0f0f0' }}></div>
                        <div className="thumbnail-grid">
                            <div className="skeleton-box" style={{ aspectRatio: '1/1', background: '#f0f0f0' }}></div>
                            <div className="skeleton-box" style={{ aspectRatio: '1/1', background: '#f0f0f0' }}></div>
                        </div>
                    </div>
                    {/* Skeleton: Product Info */}
                    <div className="product-info-column">
                        <div className="skeleton-box" style={{ width: '80px', height: '16px', background: '#f0f0f0', marginBottom: '10px' }}></div>
                        <div className="skeleton-box" style={{ width: '280px', height: '40px', background: '#f0f0f0', marginBottom: '10px' }}></div>
                        <div className="skeleton-box" style={{ width: '100px', height: '24px', background: '#f0f0f0', marginBottom: '30px' }}></div>
                        <div className="skeleton-box" style={{ width: '100%', height: '20px', background: '#f0f0f0', marginBottom: '20px' }}></div>
                        {/* Size buttons skeleton */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-box" style={{ width: '50px', height: '36px', background: '#f0f0f0', borderRadius: '20px' }}></div>)}
                        </div>
                        {/* Color buttons skeleton */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                            {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ width: '70px', height: '36px', background: '#f0f0f0', borderRadius: '20px' }}></div>)}
                        </div>
                        {/* Add to cart button skeleton */}
                        <div className="skeleton-box" style={{ width: '100%', height: '50px', background: '#f0f0f0', marginBottom: '30px' }}></div>
                        {/* Description skeleton */}
                        <div className="skeleton-box" style={{ width: '100%', height: '80px', background: '#f0f0f0', marginBottom: '30px' }}></div>
                        {/* Accordions skeleton */}
                        <div style={{ width: '100%' }}>
                            {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ width: '100%', height: '50px', background: '#f0f0f0', marginBottom: '5px' }}></div>)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (!product) return <div className="error-container">Product not found</div>;

    return (
        <div className="product-details-container">
            <div className="product-details-grid">
                {/* Left Column: Images */}
                <div className="product-gallery">
                    <div className="main-image-wrapper">
                        <img
                            src={product.image_url}
                            alt={product.title}
                            className="main-image"
                        />
                    </div>
                    {/* Placeholder for thumbnails if we had more images */}
                    <div className="thumbnail-grid">
                        <img src={product.image_url} alt="View 1" className="thumbnail active" />
                        {/* Duplicates for demo since we only have 1 image usually from Printful main */}
                        <img src={product.image_url} alt="View 2" className="thumbnail" />
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="product-info-column">
                    <div className="product-breadcrumb">Wild Breeze</div>
                    <h1 className="product-title">{product.title}</h1>
                    <div className="product-price">${product.price} USD</div>

                    <div className="installment-text">
                        Pay in 4 interest-free installments of ${(product.price / 4).toFixed(2)}. <span className="learn-more">Learn more</span>
                    </div>

                    {/* Size Selector */}
                    <div className="variant-section">
                        <span className="variant-label">Size</span>
                        <div className="variant-options">
                            {sizes.map(size => (
                                <button
                                    key={size}
                                    className={`variant-btn ${selectedSize === size ? 'selected' : ''}`}
                                    onClick={() => { setSelectedSize(size); setValidationError(''); }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Selector */}
                    <div className="variant-section">
                        <span className="variant-label">Color</span>
                        <div className="variant-options">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    className={`variant-btn ${selectedColor === color ? 'selected' : ''}`}
                                    onClick={() => { setSelectedColor(color); setValidationError(''); }}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="quantity-section">
                        <span className="variant-label">Quantity</span>
                        <div className="quantity-controls">
                            <button onClick={() => handleQuantityChange(-1)}><Minus size={16} /></button>
                            <span>{quantity}</span>
                            <button onClick={() => handleQuantityChange(1)}><Plus size={16} /></button>
                        </div>
                    </div>

                    {/* Validation Error */}
                    {validationError && (
                        <div className="validation-error" style={{ color: '#dc3545', marginBottom: '10px', fontSize: '0.9rem' }}>
                            {validationError}
                        </div>
                    )}

                    {/* Add to Cart */}
                    <button className="add-to-cart-btn-large" onClick={handleAddToCart}>
                        Add to cart
                    </button>

                    {/* Description & Extra Info */}
                    <div className="product-description">
                        This processing time for this item is approximately 5 business days, but may vary. Shipped via USPS.
                        <br /><br />
                        Soft, cozy, and endlessly wearable, our embroidered bouquet sweatshirt brings a little romance to everyday style.
                    </div>

                    <div className="share-link">
                        <Share2 size={16} /> Share
                    </div>

                    {/* Accordions */}
                    <div className="accordion-group">
                        <div className="accordion-item">
                            <button className="accordion-header" onClick={() => toggleAccordion('materials')}>
                                <span>Materials</span>
                                {openAccordion === 'materials' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {openAccordion === 'materials' && (
                                <div className="accordion-content">
                                    80% Cotton, 20% Polyester. High quality embroidery.
                                </div>
                            )}
                        </div>
                        <div className="accordion-item">
                            <button className="accordion-header" onClick={() => toggleAccordion('dimensions')}>
                                <span>Dimensions</span>
                                {openAccordion === 'dimensions' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {openAccordion === 'dimensions' && (
                                <div className="accordion-content">
                                    Standard unisex fit. Runs true to size.
                                </div>
                            )}
                        </div>
                        <div className="accordion-item">
                            <button className="accordion-header" onClick={() => toggleAccordion('care')}>
                                <span>Care information</span>
                                {openAccordion === 'care' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {openAccordion === 'care' && (
                                <div className="accordion-content">
                                    Machine wash cold inside out. Tumble dry low. Do not iron directly on embroidery.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
