import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import './Account.css';

const Account = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Clear guest cart too if any residues, though usually we want to keep it? 
        // Standard behavior: clear local storage tokens.
        navigate('/');
        window.location.reload();
    };

    if (!user) return null; // Or a loading spinner

    return (
        <div className="account-page">
            <div className="account-header">
                <h1 className="account-title">Account</h1>
                <div className="logout-link" onClick={handleLogout}>
                    <User size={16} />
                    Log out
                </div>
            </div>

            <div className="account-content">
                <div className="order-history-section">
                    <h2 className="section-title">Order history</h2>
                    <p className="empty-orders-text">You haven't placed any orders yet.</p>
                </div>

                <div className="account-details-section">
                    <h2 className="section-title">Account details</h2>
                    <div className="account-details-content">
                        {/* Placeholder logic for address - usually fetched from API */}
                        <p>{user.firstName ? `${user.firstName} ${user.lastName}` : user.email}</p>
                        <p>United States</p>
                        <div className="view-addresses-link">View addresses (1)</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;
