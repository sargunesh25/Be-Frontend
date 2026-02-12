import { useState } from 'react';
import { X } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Shop from './pages/Shop';
import Orders from './pages/Orders'; // Import Orders
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Account from './pages/Account';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import { CartProvider } from './context/CartContext';
import AddedToCartModal from './components/AddedToCartModal';
import DiscountModal from './components/DiscountModal';
import AuthModal from './components/AuthModal'; // Import AuthModal
import './components/DiscountModal.css'; // For trigger button styles

function App() {
  const [promoText, setPromoText] = useState("All orders $100+ ship for free!");
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false); // Auth Modal State
  const [isTriggerVisible, setIsTriggerVisible] = useState(true);

  return (
    <div className="App">
      <Router>
        <CartProvider>
          <Navbar promoText={promoText} openAuth={() => setIsAuthOpen(true)} />
          <AddedToCartModal />
          <DiscountModal isOpen={isDiscountOpen} onClose={() => setIsDiscountOpen(false)} />
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

          {isTriggerVisible && (
            <button className="discount-trigger-btn" onClick={() => setIsDiscountOpen(true)}>
              <div
                className="trigger-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTriggerVisible(false);
                }}
              >
                <X size={12} />
              </div>
              GET 10% OFF
            </button>
          )}

          <Routes>
            <Route path="/" element={<Home setPromoText={setPromoText} />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/account" element={<Account />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
          <Footer />
        </CartProvider>
      </Router>
    </div>
  );
}

export default App;
