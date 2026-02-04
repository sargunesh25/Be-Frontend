import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';
import { registerUser, mergeCart, loginUser } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await registerUser(formData.email, formData.password, formData.firstName, formData.lastName);

            // Auto login after register to merge cart
            const loginData = await loginUser(formData.email, formData.password);
            localStorage.setItem('token', loginData.token);
            localStorage.setItem('user', JSON.stringify(loginData.user));

            // Merge guest cart
            const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
            if (guestCart.length > 0) {
                await mergeCart(guestCart);
                localStorage.removeItem('guest_cart');
            }

            alert('Account created successfully!');
            navigate('/');
            window.location.reload();
        } catch (err) {
            setError('Registration failed. Please try again.');
        }
    };

    return (
        <div className="register-page">
            <h1 className="register-title">Create account</h1>

            <form className="register-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    className="register-input"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    className="register-input"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="register-input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="register-input"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                {error && <p className="error-message">{error}</p>}

                <button type="submit" className="create-btn">Create</button>
            </form>
        </div>
    );
};

export default Register;
