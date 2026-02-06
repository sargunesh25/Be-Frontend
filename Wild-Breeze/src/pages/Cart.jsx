import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import './Cart.css';
import { getCart, addToCart as apiAddToCart, removeFromCart, isAuthenticated } from '../services/api';
import { useCart } from '../context/CartContext';

const Cart = () => {
    const navigate = useNavigate();
    const { fetchCartCount } = useCart();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const loadApiCart = async () => {
        try {
            const items = await getCart();
            // Sort by id to prevent jumping
            items.sort((a, b) => a.id - b.id);
            setCartItems(items);
        } catch (error) {
            console.error('Failed to load cart', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGuestCart = () => {
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        setCartItems(guestCart);
        setLoading(false);
    };

    useEffect(() => {
        // Check authentication using JWT token
        const token = localStorage.getItem('authToken');
        const loggedIn = !!token && isAuthenticated();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
            loadApiCart();
        } else {
            loadGuestCart();
        }
    }, []);

    const updateQuantity = async (item, delta) => {
        const newQty = item.quantity + delta;
        if (newQty < 1) return; // Don't allow 0 via buttons, use trash

        if (isLoggedIn) {
            try {
                // Determine logic: apiAddToCart adds to existing. 
                // So adding 1 works. removing 1 means adding -1.
                await apiAddToCart(item.product_id, delta);

                // Refresh cart to get updated state
                await loadApiCart();
            } catch (error) {
                console.error('Failed to update quantity', error);
            }
        } else {
            const updatedCart = cartItems.map(cartItem => {
                if (cartItem.product_id === item.product_id) {
                    return { ...cartItem, quantity: newQty };
                }
                return cartItem;
            });
            setCartItems(updatedCart);
            localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
        }
    };

    const handleRemove = async (productId) => {
        if (isLoggedIn) {
            try {
                await removeFromCart(productId);
                setCartItems(prev => prev.filter(item => item.product_id !== productId));
            } catch (error) {
                console.error('Failed to remove item', error);
            }
        } else {
            const updatedCart = cartItems.filter(item => item.product_id !== productId);
            setCartItems(updatedCart);
            localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
        }
    };

    const handleCheckout = () => {
        if (isLoggedIn) {
            alert('Proceeding to checkout...');
        } else {
            navigate('/login');
        }
    };

    if (loading) return <div className="cart-page-loading">Loading...</div>;

    if (cartItems.length === 0) {
        return (
            <div className="cart-empty-state">
                <h1 className="cart-title">Your cart is empty</h1>
                <Link to="/shop" className="continue-shopping-link">Continue shopping</Link>
                {!isLoggedIn && (
                    <div className="cart-login-prompt">
                        <p>Have an account?</p>
                        <p><Link to="/login">Log in</Link> to check out faster.</p>
                    </div>
                )}
            </div>
        );
    }

    const subtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

    return (
        <div className="cart-page-container">
            <div className="cart-header-row">
                <h1 className="cart-page-title">Your cart</h1>
                <Link to="/shop" className="continue-shopping-top">Continue shopping</Link>
            </div>

            <div className="cart-table">
                <div className="cart-table-headings">
                    <span className="col-product">PRODUCT</span>
                    <span className="col-quantity">QUANTITY</span>
                    <span className="col-total">TOTAL</span>
                </div>

                <div className="cart-table-body">
                    {cartItems.map((item) => (
                        <div key={item.id || item.product_id} className="cart-row">
                            <div className="col-product-data">
                                <img src={item.image_url || 'https://via.placeholder.com/150'} alt={item.title} className="cart-row-img" />
                                <div className="cart-row-info">
                                    <h3 className="cart-row-title">{item.title}</h3>
                                    <p className="cart-row-price">${item.price}</p>
                                    {/* Placeholders for UI matching */}
                                    <p className="cart-row-variant">Size: Unisex Small</p>
                                    <p className="cart-row-variant">Color: Oatmeal Heather</p>
                                </div>
                            </div>

                            <div className="col-quantity-data">
                                <div className="qty-selector">
                                    <button onClick={() => updateQuantity(item, -1)} disabled={item.quantity <= 1}><Minus size={14} /></button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item, 1)}><Plus size={14} /></button>
                                </div>
                                <button className="trash-btn" onClick={() => handleRemove(item.product_id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="col-total-data">
                                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="cart-footer-section">


                <div className="cart-summary-box">
                    <div className="subtotal-row">
                        <span>Subtotal</span>
                        <span className="subtotal-val">${subtotal.toFixed(2)} USD</span>
                    </div>
                    <p className="taxes-note">Taxes and shipping calculated at checkout</p>
                    <button className="checkout-btn" onClick={() => navigate('/checkout')}>Check out</button>
                </div>
            </div>

        </div>
    );
};

export default Cart;
