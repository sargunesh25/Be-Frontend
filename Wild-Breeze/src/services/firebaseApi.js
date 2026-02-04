// Firebase-based API service layer
// Replaces the backend API with Firebase Firestore and Authentication

import { db, auth } from '../firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    increment,
    serverTimestamp
} from 'firebase/firestore';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from 'firebase/auth';

// ==================== PRODUCTS ====================

export const getProducts = async (filters = {}) => {
    try {
        const productsRef = collection(db, 'products');

        // Start with base query
        let q = query(productsRef);

        // Firestore doesn't support complex queries with multiple inequalities
        // So we fetch all and filter client-side for flexibility
        const snapshot = await getDocs(q);
        let products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Apply availability filter
        if (filters.availability === 'in_stock') {
            products = products.filter(p => p.is_available === true);
        } else if (filters.availability === 'out_of_stock') {
            products = products.filter(p => p.is_available === false);
        }

        // Apply category filter
        if (filters.category) {
            products = products.filter(p => p.category === filters.category);
        }

        // Apply price filters
        if (filters.min_price) {
            products = products.filter(p => parseFloat(p.price) >= parseFloat(filters.min_price));
        }
        if (filters.max_price) {
            products = products.filter(p => parseFloat(p.price) <= parseFloat(filters.max_price));
        }

        // Apply sorting
        const { sort } = filters;
        if (sort === 'price_asc') {
            products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        } else if (sort === 'price_desc') {
            products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        } else if (sort === 'alphabetical_az') {
            products.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === 'alphabetical_za') {
            products.sort((a, b) => b.title.localeCompare(a.title));
        } else if (sort === 'date_old_new') {
            products.sort((a, b) => (a.created_at?.toMillis?.() || 0) - (b.created_at?.toMillis?.() || 0));
        } else if (sort === 'date_new_old') {
            products.sort((a, b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0));
        } else {
            // Default: newest first
            products.sort((a, b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0));
        }

        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

// ==================== HERO SLIDES ====================

export const getHeroSlides = async () => {
    try {
        const slidesRef = collection(db, 'hero_slides');
        // Fetch all slides and filter/sort client-side to avoid composite index requirement
        const snapshot = await getDocs(slidesRef);

        let slides = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filter active slides and sort by sort_order
        slides = slides
            .filter(slide => slide.is_active === true)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        return slides;
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        return [];
    }
};

// ==================== FAQs ====================

export const getFAQs = async () => {
    try {
        const faqsRef = collection(db, 'faqs');
        const q = query(faqsRef, orderBy('sort_order', 'asc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return [];
    }
};

// ==================== CONTACT ====================

export const submitContact = async (data) => {
    try {
        const contactRef = collection(db, 'contact_messages');
        await addDoc(contactRef, {
            ...data,
            created_at: serverTimestamp()
        });
        return { success: true, message: 'Message received' };
    } catch (error) {
        console.error('Error submitting contact form:', error);
        throw error;
    }
};

// ==================== AUTHENTICATION ====================

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();

        return {
            token,
            user: {
                id: user.uid,
                email: user.email
            }
        };
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

export const registerUser = async (email, password, firstName, lastName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store additional user data in Firestore
        const usersRef = collection(db, 'users');
        await addDoc(usersRef, {
            uid: user.uid,
            email: user.email,
            firstName: firstName || '',
            lastName: lastName || '',
            created_at: serverTimestamp()
        });

        return {
            id: user.uid,
            email: user.email
        };
    } catch (error) {
        console.error('Error registering:', error);
        throw error;
    }
};

// ==================== CART ====================

const getCurrentUserId = () => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    return user.uid;
};

export const getCart = async () => {
    try {
        const userId = getCurrentUserId();
        const cartRef = collection(db, 'cart_items');
        const q = query(cartRef, where('user_id', '==', userId));
        const snapshot = await getDocs(q);

        const cartItems = [];
        for (const cartDoc of snapshot.docs) {
            const cartData = cartDoc.data();

            // Get product details
            const productRef = doc(db, 'products', cartData.product_id);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
                const productData = productSnap.data();
                cartItems.push({
                    id: cartDoc.id,
                    quantity: cartData.quantity,
                    product_id: cartData.product_id,
                    title: productData.title,
                    price: productData.price,
                    image_url: productData.image_url
                });
            }
        }

        return cartItems;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return [];
    }
};

export const addToCart = async (productId, quantity = 1) => {
    try {
        const userId = getCurrentUserId();
        const cartRef = collection(db, 'cart_items');

        // Check if item already exists
        const q = query(cartRef,
            where('user_id', '==', userId),
            where('product_id', '==', productId.toString())
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Update existing item
            const existingDoc = snapshot.docs[0];
            await updateDoc(existingDoc.ref, {
                quantity: increment(quantity)
            });
            return { ...existingDoc.data(), quantity: existingDoc.data().quantity + quantity };
        } else {
            // Add new item
            const newItem = {
                user_id: userId,
                product_id: productId.toString(),
                quantity,
                created_at: serverTimestamp()
            };
            const docRef = await addDoc(cartRef, newItem);
            return { id: docRef.id, ...newItem };
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
};

export const removeFromCart = async (productId) => {
    try {
        const userId = getCurrentUserId();
        const cartRef = collection(db, 'cart_items');

        const q = query(cartRef,
            where('user_id', '==', userId),
            where('product_id', '==', productId.toString())
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            await deleteDoc(snapshot.docs[0].ref);
        }

        return { message: 'Item removed' };
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }
};

export const mergeCart = async (guestCart) => {
    try {
        if (!Array.isArray(guestCart) || guestCart.length === 0) {
            return [];
        }

        const userId = getCurrentUserId();

        for (const item of guestCart) {
            await addToCart(item.product_id, item.quantity);
        }

        // Return updated cart
        return await getCart();
    } catch (error) {
        console.error('Error merging cart:', error);
        return [];
    }
};

// ==================== SUBSCRIBE ====================

export const subscribeUser = async (phoneNumber) => {
    try {
        const signupsRef = collection(db, 'discount_signups');

        // Check if already exists
        const q = query(signupsRef, where('phone_number', '==', phoneNumber));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            await addDoc(signupsRef, {
                phone_number: phoneNumber,
                created_at: serverTimestamp()
            });
        }

        return {
            message: 'Discount activated!',
            discountActive: true
        };
    } catch (error) {
        console.error('Error subscribing:', error);
        throw error;
    }
};

// Default export for compatibility
export default {
    getProducts,
    getHeroSlides,
    getFAQs,
    submitContact,
    loginUser,
    registerUser,
    getCart,
    addToCart,
    removeFromCart,
    mergeCart,
    subscribeUser
};
