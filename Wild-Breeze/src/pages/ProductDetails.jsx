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
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const { addToCart } = useCart();

    // Accordion states
    const [openAccordion, setOpenAccordion] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            const data = await getProduct(id);
            setProduct(data);
            setLoading(false);

            // Set defaults if variants exist
            if (data?.variants && data.variants.length > 0) {
                // Logic to extract unique sizes/colors would go here.
                // For now, we'll simulate or just default if we can parse them.
            }
        };
        fetchProduct();
    }, [id]);

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const handleAddToCart = () => {
        if (product) {
            addToCart(product, quantity); // Context might need an update to handle quantity if not already supported
            // Optional: Open cart drawer or show notification
        }
    };

    const toggleAccordion = (section) => {
        setOpenAccordion(openAccordion === section ? null : section);
    };

    if (loading) return <div className="loading-container">Loading...</div>;
    if (!product) return <div className="error-container">Product not found</div>;

    // Dummy data for visual completeness matching the Screenshot
    const sizes = ['S', 'M', 'L', 'XL', '2XL'];
    const colors = ['Cream', 'Sea Foam', 'Navy'];

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
                    <div className="product-breadcrumb">Sun Milk</div>
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
                                    onClick={() => setSelectedSize(size)}
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
                                    onClick={() => setSelectedColor(color)}
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
