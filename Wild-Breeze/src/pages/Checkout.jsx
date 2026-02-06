import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Lock, Wind, ShoppingBag } from 'lucide-react';
import { submitOrder } from '../services/api';
import './Checkout.css';

const Checkout = () => {
    const { isLoggedIn } = useCart();
    // Re-fetch cart items locally or via context. 
    // Ideally context should expose items, but current implementation in Cart.jsx fetches them local state.
    // For this mock checkout, we'll try to get them from localStorage or mock if empty for visual dev.
    // For this mock checkout, we'll try to get them from localStorage or mock if empty for visual dev.
    const [cartItems, setCartItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('guest_cart') || '[]');
        } catch (e) {
            return [];
        }
    });

    // Data State
    const [availableStates, setAvailableStates] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    // Form State
    const [form, setForm] = useState({
        email: '',
        newsOffers: false,
        country: '',
        firstName: '',
        lastName: '',
        address: '',
        apartment: '',
        city: '',
        state: '',
        zip: '',
        saveInfo: false
    });

    // Payment Accordion State
    const [paymentMethod, setPaymentMethod] = useState('credit_card');



    // Handle Country Change


    const handlePayNow = async () => {
        setSubmitting(true);
        try {
            const orderData = {
                recipient: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    address: form.address,
                    apartment: form.apartment,
                    city: form.city,
                    countryCode: form.country,
                    stateCode: form.state,
                    zip: form.zip,
                    email: form.email
                },
                items: cartItems.map(item => ({
                    id: item.product_id,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const response = await submitOrder(orderData);
            alert(`Order validated! Estimated costs: ${JSON.stringify(response.costs)}`);
            // In real flow: Redirect to success or payment gateway
        } catch (error) {
            alert(`Order validation failed: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    const shipping = 0; // Calculated at next step usually
    const total = subtotal + shipping;

    return (
        <div className="checkout-container">
            <div className="checkout-logo-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" className="site-title icon-title-wrapper" style={{ textDecoration: 'none' }}>
                    <Wind size={32} className="title-icon" />
                    <span>Wild breeze</span>
                </Link>
                <Link to="/cart" style={{ textDecoration: 'none', color: '#333' }}>
                    <ShoppingBag size={24} />
                </Link>
            </div>

            <div className="checkout-grid">

                {/* LEFT COLUMN - MAIN FORM */}
                <div className="checkout-main">
                    <div className="checkout-header">

                        <div className="breadcrumb">
                            <span className="breadcrumb-item">Cart</span>
                            <span className="breadcrumb-separator">{'>'}</span>
                            <span className="breadcrumb-item active">Information</span>
                            <span className="breadcrumb-separator">{'>'}</span>
                            <span className="breadcrumb-item">Shipping</span>
                            <span className="breadcrumb-separator">{'>'}</span>
                            <span className="breadcrumb-item">Payment</span>
                        </div>
                    </div>

                    <div className="express-checkout">
                        <p className="section-label-center">Express checkout</p>
                        <div className="express-buttons">
                            <button className="express-btn shop-pay">shop</button>
                            <button className="express-btn paypal">PayPal</button>
                            <button className="express-btn gpay">G Pay</button>
                        </div>
                    </div>

                    <div className="divider-or">OR</div>

                    {/* CONTACT */}
                    <div className="form-section">
                        <div className="section-header">
                            <h2 className="section-title">Contact</h2>
                            {!isLoggedIn && <Link to="/login" className="login-link">Log in</Link>}
                        </div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="input-field"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={form.newsOffers}
                                onChange={e => setForm({ ...form, newsOffers: e.target.checked })}
                            />
                            Email me with news and offers
                        </label>
                    </div>

                    {/* DELIVERY */}
                    <div className="form-section">
                        <div className="section-header">
                            <h2 className="section-title">Delivery</h2>
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Country/Region"
                                className="input-field"
                                value={form.country}
                                onChange={e => setForm({ ...form, country: e.target.value })}
                            />
                        </div>
                        <div className="input-row">
                            <input
                                type="text"
                                placeholder="First name"
                                className="input-field"
                                value={form.firstName}
                                onChange={e => setForm({ ...form, firstName: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Last name"
                                className="input-field"
                                value={form.lastName}
                                onChange={e => setForm({ ...form, lastName: e.target.value })}
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Address"
                            className="input-field"
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Apartment, suite, etc. (optional)"
                            className="input-field"
                            value={form.apartment}
                            onChange={e => setForm({ ...form, apartment: e.target.value })}
                        />
                        <div className="input-row three-col">
                            <input
                                type="text"
                                placeholder="City"
                                className="input-field"
                                value={form.city}
                                onChange={e => setForm({ ...form, city: e.target.value })}
                            />

                            {availableStates.length > 0 ? (
                                <select
                                    className="input-field"
                                    value={form.state}
                                    onChange={e => setForm({ ...form, state: e.target.value })}
                                >
                                    <option value="" disabled>State</option>
                                    {availableStates.map(s => (
                                        <option key={s.code} value={s.code}>{s.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="State/Region"
                                    className="input-field"
                                    value={form.state}
                                    onChange={e => setForm({ ...form, state: e.target.value })}
                                />
                            )}

                            <input
                                type="text"
                                placeholder="ZIP code"
                                className="input-field"
                                value={form.zip}
                                onChange={e => setForm({ ...form, zip: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* SHIPPING METHOD NOTICE */}
                    <div className="form-section">
                        <h2 className="section-title">Shipping method</h2>
                        <div className="shipping-notice">
                            Enter your shipping address to view available shipping methods.
                        </div>
                    </div>

                    {/* PAYMENT */}
                    <div className="form-section">
                        <div className="section-header payment-header-container">
                            <h2 className="section-title">Payment</h2>
                            <p className="secure-text">All transactions are secure and encrypted.</p>
                        </div>

                        <div className="payment-accordion">
                            {/* Credit Card */}
                            <div className={`payment-option ${paymentMethod === 'credit_card' ? 'active' : ''}`}>
                                <div className="payment-header" onClick={() => setPaymentMethod('credit_card')}>
                                    <div className="radio-label">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'credit_card'}
                                            readOnly
                                        />
                                        <span>Credit card</span>
                                    </div>
                                    <div className="payment-icons">
                                        <span className="pay-icon visa">VISA</span>
                                        <span className="pay-icon master">MC</span>
                                        <span className="pay-icon amex">AMEX</span>
                                        <span className="pay-icon more">+5</span>
                                    </div>
                                </div>
                                {paymentMethod === 'credit_card' && (
                                    <div className="payment-content">
                                        <div className="input-group-icon">
                                            <input type="text" placeholder="Card number" className="input-field" />
                                            <Lock size={16} className="icon-right" />
                                        </div>
                                        <div className="input-row">
                                            <input type="text" placeholder="Expiration date (MM / YY)" className="input-field" />
                                            <input type="text" placeholder="Security code" className="input-field" />
                                        </div>
                                        <input type="text" placeholder="Name on card" className="input-field" />

                                        <label className="checkbox-label">
                                            <input type="checkbox" defaultChecked />
                                            Use shipping address as billing address
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Shop Pay */}
                            <div className={`payment-option ${paymentMethod === 'shop_pay' ? 'active' : ''}`}>
                                <div className="payment-header" onClick={() => setPaymentMethod('shop_pay')}>
                                    <div className="radio-label">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'shop_pay'}
                                            readOnly
                                        />
                                        <span className="shop-pay-text">Shop Pay - Pay in full or in installments</span>
                                    </div>
                                    <span className="brand-logo shop">shop</span>
                                </div>
                            </div>

                            {/* PayPal */}
                            <div className={`payment-option ${paymentMethod === 'paypal' ? 'active' : ''}`}>
                                <div className="payment-header" onClick={() => setPaymentMethod('paypal')}>
                                    <div className="radio-label">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'paypal'}
                                            readOnly
                                        />
                                        <span>PayPal</span>
                                    </div>
                                    <span className="brand-logo paypal">PayPal</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PAY NOW BUTTON */}
                    <button className="pay-now-btn" onClick={handlePayNow} disabled={submitting}>
                        {submitting ? 'Processing...' : 'Pay now'}
                    </button>

                    <div className="checkout-footer-links">
                        <a href="#">Privacy policy</a>
                        <a href="#">Terms of service</a>
                    </div>
                </div>


                {/* RIGHT COLUMN - ORDER SUMMARY */}
                <div className="checkout-sidebar">
                    {/* Mobile Toggle Header */}
                    <button className="order-summary-toggle" onClick={() => setIsSummaryOpen(!isSummaryOpen)}>
                        <div className="toggle-left">
                            <span className="toggle-text">
                                {isSummaryOpen ? 'Hide' : 'Show'} order summary
                                {isSummaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                        </div>
                        <div className="toggle-right">
                            <span className="toggle-total-preview">${total.toFixed(2)}</span>
                        </div>
                    </button>

                    <div className={`sidebar-content ${isSummaryOpen ? 'open' : ''}`}>
                        <div className="order-summary-items">
                            {cartItems.map((item, index) => (
                                <div key={index} className="summary-item">
                                    <div className="item-image-wrapper">
                                        <img src={item.image_url} alt={item.title} className="item-image" />
                                        <span className="item-badge">{item.quantity}</span>
                                    </div>
                                    <div className="item-info">
                                        <p className="item-title">{item.title}</p>
                                        <p className="item-variant">S / Cream</p>
                                    </div>
                                    <div className="item-price">${item.price}</div>
                                </div>
                            ))}
                        </div>

                        <div className="discount-code-row">
                            <input type="text" placeholder="Discount code" className="input-field discount-input" />
                            <button className="apply-btn">Apply</button>
                        </div>

                        <div className="cost-breakdown">
                            <div className="cost-row">
                                <span>Subtotal • {cartItems.length} items</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="cost-row">
                                <span>Shipping</span>
                                <span className="shipping-text">Enter shipping address</span>
                            </div>
                        </div>

                        <div className="cost-row total-row">
                            <span className="total-label">Total</span>
                            <div className="total-value-group">
                                <span className="currency">USD</span>
                                <span className="total-amount">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
