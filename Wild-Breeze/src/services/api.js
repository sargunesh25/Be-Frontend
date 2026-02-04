// API service layer - now using Firebase
// This file re-exports all functions from firebaseApi.js for backward compatibility
// All existing component imports will continue to work without changes

export {
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
} from './firebaseApi';

// Default export for compatibility
import firebaseApi from './firebaseApi';
export default firebaseApi;
