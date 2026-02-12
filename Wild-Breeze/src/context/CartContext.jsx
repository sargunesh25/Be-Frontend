import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart as apiAddToCart, isAuthenticated } from '../services/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lastAddedItem, setLastAddedItem] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check auth state on mount and when localStorage changes
    useEffect(() => {
        const checkAuth = () => {
            const loggedIn = isAuthenticated();
            setIsLoggedIn(loggedIn);

            if (loggedIn) {
                fetchCartCount();
            } else {
                // User is signed out, load guest cart
                const cart = JSON.parse(localStorage.getItem('guestCart') || '[]');
                const count = cart.reduce((acc, item) => acc + item.quantity, 0);
                setCartCount(count);
            }
        };

        checkAuth();

        // Listen for storage changes (login/logout in other tabs)
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    const fetchCartCount = async () => {
        const token = localStorage.getItem('authToken');
        if (token && isAuthenticated()) {
            try {
                const cartItems = await getCart();
                const count = cartItems.reduce((acc, item) => acc + item.quantity, 0);
                setCartCount(count);
            } catch (err) {
                console.error("Failed to fetch cart count", err);
            }
        } else {
            // Guest cart
            const cart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const count = cart.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
        }
    };

    const addToCart = async (product, quantity = 1) => {
        const token = localStorage.getItem('authToken');
        let success = false;

        if (token && isAuthenticated()) {
            try {
                // Pass complete product data to API
                await apiAddToCart({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image_url: product.image_url,
                    selectedSize: product.selectedSize,
                    selectedColor: product.selectedColor
                }, quantity);
                success = true;
            } catch (err) {
                console.error("Failed to add to cart API", err);
                const errorMsg = err.response?.data?.error || err.message || "Unknown error";
                alert(`Failed to add to cart: ${errorMsg}`);
                return;
            }
        } else {
            // Guest Logic
            const cart = JSON.parse(localStorage.getItem('guestCart') || '[]');
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
            localStorage.setItem('guestCart', JSON.stringify(cart));
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

    // Function to refresh auth state (call after login/logout)
    const refreshAuthState = () => {
        const loggedIn = isAuthenticated();
        setIsLoggedIn(loggedIn);
        fetchCartCount();
    };

    return (
        <CartContext.Provider value={{ cartCount, addToCart, isModalOpen, lastAddedItem, closeModal, fetchCartCount, isLoggedIn, refreshAuthState }}>
            {children}
        </CartContext.Provider>
    );
};
