import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Account.css'; // Reusing Account CSS for consistency

const Orders = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]); // Placeholder for now

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }

        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }

        // Fetch orders here later
    }, [navigate]);

    if (!user) return null;

    return (
        <div className="account-page">
            <h1 className="account-title">My Orders</h1>

            <div className="account-content">
                <div className="order-history-section" style={{ width: '100%' }}>
                    {orders.length === 0 ? (
                        <p className="empty-orders-text">You haven't placed any orders yet.</p>
                    ) : (
                        <div className="orders-list">
                            {/* Render orders here */}
                            <p>Orders will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Orders;
