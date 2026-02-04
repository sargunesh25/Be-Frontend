import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart as apiAddToCart } from '../services/api';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lastAddedItem, setLastAddedItem] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
            if (user) {
                // User is signed in, fetch cart
                fetchCartCount();
            } else {
                // User is signed out, load guest cart
                const cart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
                const count = cart.reduce((acc, item) => acc + item.quantity, 0);
                setCartCount(count);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchCartCount = async () => {
        const token = localStorage.getItem('token');
        if (token && auth.currentUser) {
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

    const addToCart = async (product, quantity = 1) => {
        const token = localStorage.getItem('token');
        let success = false;

        if (token && auth.currentUser) {
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
        <CartContext.Provider value={{ cartCount, addToCart, isModalOpen, lastAddedItem, closeModal, fetchCartCount, isLoggedIn }}>
            {children}
        </CartContext.Provider>
    );
};
