import React from 'react';
import { X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './AddedToCartModal.css';

const AddedToCartModal = () => {
    const { isModalOpen, lastAddedItem, closeModal, cartCount } = useCart();
    const navigate = useNavigate();

    if (!isModalOpen || !lastAddedItem) return null;

    return (
        <div className="cart-modal-overlay">
            <div className="cart-modal">
                <div className="cart-modal-header">
                    <div className="success-message">
                        <Check size={16} /> Item added to your cart
                    </div>
                    <button className="close-btn" onClick={closeModal}>
                        <X size={20} />
                    </button>
                </div>

                <div className="cart-modal-body">
                    <img
                        src={lastAddedItem.image_url || 'https://via.placeholder.com/100'}
                        alt={lastAddedItem.title}
                        className="modal-product-image"
                    />
                    <div className="modal-product-details">
                        <h4 className="modal-product-title">{lastAddedItem.title}</h4>
                        {/* Placeholder for size/color if data existed */}
                        {lastAddedItem.description && <p className="modal-product-variant">{lastAddedItem.description}</p>}
                    </div>
                </div>

                <div className="cart-modal-actions">
                    <button className="btn-secondary" onClick={() => { closeModal(); navigate('/cart'); }}>
                        View my cart ({cartCount})
                    </button>
                    <button className="btn-primary" onClick={() => { closeModal(); navigate('/cart'); }}>
                        Check out
                    </button>
                    <button className="btn-link" onClick={closeModal}>
                        Continue shopping
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddedToCartModal;
