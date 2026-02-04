import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart as apiAddToCart } from '../services/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lastAddedItem, setLastAddedItem] = useState(null);

    const fetchCartCount = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const cartItems = await getCart();
                const count = cartItems.reduce((acc, item) => acc + item.quantity, 0);
                setCartCount(count);
            } catch (err) {
                console.error("Failed to fetch cart count", err);
            }
        } else {
            // Guest cart
            const cart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
            const count = cart.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
        }
    };

    // Fetch initial cart count
    useEffect(() => {
        fetchCartCount();
    }, []);

    const addToCart = async (product, quantity = 1) => {
        const token = localStorage.getItem('token');
        let success = false;

        if (token) {
            try {
                await apiAddToCart(product.id, quantity);
                success = true;
            } catch (err) {
                console.error("Failed to add to cart API", err);
                const errorMsg = err.response?.data?.error || err.message || "Unknown error";
                alert(`Failed to add to cart: ${errorMsg}`);
                return;
            }
        } else {
            // Guest Logic
            const cart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
            const existingItem = cart.find(item => item.product_id === product.id);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    product_id: product.id,
                    title: product.title,
                    price: product.price,
                    image_url: product.image_url,
                    quantity: quantity
                });
            }
            localStorage.setItem('guest_cart', JSON.stringify(cart));
            success = true;
        }

        if (success) {
            setCartCount(prev => prev + quantity);
            setLastAddedItem(product);
            setIsModalOpen(true);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setLastAddedItem(null);
    };

    return (
        <CartContext.Provider value={{ cartCount, addToCart, isModalOpen, lastAddedItem, closeModal, fetchCartCount }}>
            {children}
        </CartContext.Provider>
    );
};
