// Cloudflare Workers API service layer
// Replaces Firebase with Cloudflare Workers + D1

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// Token management
let authToken = localStorage.getItem('authToken');

const setAuthToken = (token) => {
    authToken = token;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};

const getAuthHeaders = () => {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
};

// API fetch helper
const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
};

// ==================== PRODUCTS ====================

export const getProducts = async (filters = {}) => {
    // Products are fetched from Printful, not D1
    // D1 products endpoint is for future use if you want to store products locally
    try {
        const response = await apiFetch('/api/printful/products');
        let products = response.products || [];

        // Apply client-side filters
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
        return await apiFetch('/api/hero-slides');
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        return [];
    }
};

// ==================== FAQs ====================

export const getFAQs = async () => {
    try {
        return await apiFetch('/api/faqs');
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return [];
    }
};

// ==================== CONTACT ====================

export const submitContact = async (data) => {
    return await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

// ==================== AUTHENTICATION ====================

export const loginUser = async (email, password) => {
    const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    if (response.token) {
        setAuthToken(response.token);
    }

    return response;
};

export const registerUser = async (email, password, firstName, lastName) => {
    const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName })
    });

    return response;
};

export const logoutUser = () => {
    setAuthToken(null);
    localStorage.removeItem('user');
};

export const isAuthenticated = () => {
    return !!authToken;
};

// ==================== CART ====================

export const getCart = async () => {
    try {
        if (!isAuthenticated()) {
            // Return guest cart from localStorage
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            return guestCart;
        }
        return await apiFetch('/api/cart');
    } catch (error) {
        console.error('Error fetching cart:', error);
        return [];
    }
};

export const addToCart = async (productId, quantity = 1) => {
    try {
        if (!isAuthenticated()) {
            // Add to guest cart in localStorage
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const existingIndex = guestCart.findIndex(item => item.product_id === productId.toString());

            if (existingIndex >= 0) {
                guestCart[existingIndex].quantity += quantity;
            } else {
                guestCart.push({ product_id: productId.toString(), quantity });
            }

            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            return { product_id: productId, quantity };
        }

        return await apiFetch('/api/cart', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
};

export const removeFromCart = async (productId) => {
    try {
        if (!isAuthenticated()) {
            // Remove from guest cart
            let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            guestCart = guestCart.filter(item => item.product_id !== productId.toString());
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            return { message: 'Item removed' };
        }

        return await apiFetch(`/api/cart/${productId}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }
};

export const mergeCart = async (guestCart) => {
    try {
        if (!Array.isArray(guestCart) || guestCart.length === 0) {
            return await getCart();
        }

        const result = await apiFetch('/api/cart/merge', {
            method: 'POST',
            body: JSON.stringify({ guestCart })
        });

        // Clear guest cart after merge
        localStorage.removeItem('guestCart');

        return result;
    } catch (error) {
        console.error('Error merging cart:', error);
        return [];
    }
};

// ==================== SUBSCRIBE ====================

export const subscribeUser = async (phoneNumber) => {
    return await apiFetch('/api/subscribe', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber })
    });
};

// ==================== PRINTFUL ====================

export const getPrintfulProducts = async (filters = {}) => {
    try {
        const response = await apiFetch('/api/printful/products');
        let products = response.products || [];

        // Apply client-side filters if needed
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
        }

        return products;
    } catch (error) {
        console.error('Error fetching Printful products:', error);
        return [];
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
    logoutUser,
    isAuthenticated,
    getCart,
    addToCart,
    removeFromCart,
    mergeCart,
    subscribeUser,
    getPrintfulProducts
};
