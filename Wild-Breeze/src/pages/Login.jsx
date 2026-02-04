import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { loginUser, mergeCart } from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await loginUser(email, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Merge guest cart
            const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
            if (guestCart.length > 0) {
                await mergeCart(guestCart);
                localStorage.removeItem('guest_cart');
            }

            navigate('/');
            // Reload page to ensure navbar updates state (simple fix)
            window.location.reload();
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="login-page">
            <h1 className="login-title">Login</h1>

            <form className="login-form" onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && <p className="error-message">{error}</p>}

                <div className="forgot-password">
                    <a href="#">Forgot your password?</a>
                </div>

                <button type="submit" className="signin-btn">Sign in</button>

                <div className="create-account">
                    <Link to="/register">Create account</Link>
                </div>
            </form>
        </div>
    );
};

export default Login;
