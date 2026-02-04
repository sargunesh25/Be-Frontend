import { Link, useLocation } from 'react-router-dom';
import { User, ShoppingBag, Search, ChevronDown, Wind, Menu, X } from 'lucide-react';
import './Navbar.css';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

const Navbar = ({ promoText = "All orders $100+ ship for free!" }) => {
    const location = useLocation();
    const { cartCount } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isActive = (path) => location.pathname === path ? 'active' : '';

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className="navbar-container">
            <div className="promo-bar">
                {promoText}
            </div>

            <div className="main-header">
                <div className="header-left">
                    <button className="mobile-menu-btn" onClick={toggleMenu}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <Search size={20} className="icon-btn search-icon" />
                </div>

                <Link to="/" className="site-title icon-title-wrapper" style={{ textDecoration: 'none' }}>
                    <Wind size={32} className="title-icon" />
                    <span>Wild breeze</span>
                </Link>

                <div className="header-right">
                    <Link to="/account"><User size={22} className="icon-btn" /></Link>
                    <Link to="/cart" className="cart-icon-wrapper" style={{ textDecoration: 'none', color: '#333' }}>
                        <ShoppingBag size={22} className="icon-btn" />
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </Link>
                </div>
            </div>

            <nav className={`nav-bar ${isMenuOpen ? 'open' : ''}`}>
                <ul className="nav-links">
                    <li><Link to="/" className={`nav-item ${isActive('/')}`} onClick={() => setIsMenuOpen(false)}>Home</Link></li>
                    <li><a className="nav-item" onClick={() => setIsMenuOpen(false)}>Ready to Ship</a></li>
                    <li>
                        <Link to="/shop" className={`nav-item ${isActive('/shop')}`} onClick={() => setIsMenuOpen(false)}>
                            Shop <ChevronDown size={14} />
                        </Link>
                    </li>
                    <li><Link to="/contact" className={`nav-item ${isActive('/contact')}`} onClick={() => setIsMenuOpen(false)}>Contact</Link></li>
                    <li><a className="nav-item" onClick={() => setIsMenuOpen(false)}>About Us</a></li>
                    <li><Link to="/faq" className={`nav-item ${isActive('/faq')}`} onClick={() => setIsMenuOpen(false)}>FAQ</Link></li>
                    <li><a className="nav-item" onClick={() => setIsMenuOpen(false)}>Events</a></li>
                </ul>
            </nav>
        </div>
    );
};

export default Navbar;
