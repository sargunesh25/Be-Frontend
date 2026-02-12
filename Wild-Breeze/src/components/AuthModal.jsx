import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AuthModal.css';
import { loginUser, registerUser, mergeCart } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('LOGIN'); // 'LOGIN' or 'REGISTER'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const toggleMode = () => {
        setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
        setError('');
        setFormData({ email: '', password: '', firstName: '', lastName: '' });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let userResponse;

            if (mode === 'REGISTER') {
                // Register
                await registerUser(formData.email, formData.password, formData.firstName, formData.lastName);
                // Auto login after register
                userResponse = await loginUser(formData.email, formData.password);
            } else {
                // Login
                userResponse = await loginUser(formData.email, formData.password);
            }

            // Save auth data
            localStorage.setItem('authToken', userResponse.token);
            localStorage.setItem('user', JSON.stringify(userResponse.user));

            // Merge guest cart
            const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
            if (guestCart.length > 0) {
                await mergeCart(guestCart);
                localStorage.removeItem('guest_cart');
            }

            // Close modal and refresh/redirect
            setLoading(false);
            onClose();
            // Optional: Reload to update navbar state
            window.location.reload();

        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || 'Authentication failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="auth-header">
                    <h2 className="auth-title">{mode === 'LOGIN' ? 'Login' : 'Create account'}</h2>
                    <p className="auth-subtitle">
                        {mode === 'LOGIN'
                            ? 'Please enter your e-mail and password:'
                            : 'Please enter your details to create an account:'}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'REGISTER' && (
                        <>
                            <div className="input-group">
                                <input
                                    type="text"
                                    name="firstName"
                                    className="auth-input"
                                    placeholder=" "
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                                <label className="floating-label">First name</label>
                            </div>
                            <div className="input-group">
                                <input
                                    type="text"
                                    name="lastName"
                                    className="auth-input"
                                    placeholder=" "
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                                <label className="floating-label">Last name</label>
                            </div>
                        </>
                    )}

                    <div className="input-group">
                        <input
                            type="email"
                            name="email"
                            className="auth-input"
                            placeholder=" "
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <label className="floating-label">Email</label>
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            name="password"
                            className="auth-input"
                            placeholder=" "
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <label className="floating-label">Password</label>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Processing...' : (mode === 'LOGIN' ? 'Login' : 'Create Account')}
                    </button>
                </form>

                <div className="toggle-auth">
                    {mode === 'LOGIN' ? (
                        <>
                            New customer?
                            <button className="toggle-link" onClick={toggleMode}>Create an account</button>
                        </>
                    ) : (
                        <>
                            Already have an account?
                            <button className="toggle-link" onClick={toggleMode}>Login</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
