import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid or expired
            const token = localStorage.getItem('token');
            if (token) {
                console.warn('Session expired or token invalid. Clearing token.');
                localStorage.removeItem('token');
                // Optional: Redirect to login or just reload to reset state to guest
                // window.location.href = '/login'; 
                // For smoother UX, just reload the page so the app re-initializes as guest
                window.location.reload();
            }
        }
        return Promise.reject(error);
    }
);

export const getProducts = async (filters = {}) => {
    try {
        // filters object can contain: category, sort, availability, min_price, max_price
        const response = await api.get('/products', { params: filters });
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

export const getHeroSlides = async () => {
    try {
        const response = await api.get('/hero-slides');
        return response.data;
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        return [];
    }
};

export const getFAQs = async () => {
    try {
        const response = await api.get('/faqs');
        return response.data;
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return [];
    }
};

export const submitContact = async (data) => {
    try {
        const response = await api.post('/contact', data);
        return response.data;
    } catch (error) {
        console.error('Error submitting contact form:', error);
        throw error;
    }
};

export const loginUser = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

export const registerUser = async (email, password, firstName, lastName) => {
    try {
        const response = await api.post('/auth/register', { email, password, firstName, lastName });
        return response.data;
    } catch (error) {
        console.error('Error registering:', error);
        throw error;
    }
};

export const getCart = async () => {
    try {
        const response = await api.get('/cart');
        return response.data;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return [];
    }
};

export const addToCart = async (productId, quantity = 1) => {
    try {
        const response = await api.post('/cart', { productId, quantity });
        return response.data;
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
};

export const removeFromCart = async (productId) => {
    try {
        const response = await api.delete(`/cart/${productId}`);
        return response.data;
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }
};


export const subscribeUser = async (phoneNumber) => {
    try {
        const response = await api.post('/auth/subscribe', { phoneNumber });
        return response.data;
    } catch (error) {
        console.error('Error subscribing:', error);
        throw error;
    }
};

export const mergeCart = async (guestCart) => {
    try {
        const response = await api.post('/cart/merge', { guestCart });
        return response.data;
    } catch (error) {
        console.error('Error merging cart:', error);
        // Don't throw, just log. We don't want to block login if merge fails.
        return [];
    }
};

export default api;
