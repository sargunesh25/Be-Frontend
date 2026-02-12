import { Link, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import { User, ShoppingBag, Search, ChevronDown, Wind, Menu, X } from 'lucide-react';
import './Navbar.css';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react'; // Added useEffect

const Navbar = ({ promoText = "All orders $100+ ship for free!", openAuth }) => {
    const location = useLocation();
    const { cartCount } = useCart();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        setIsLoggedIn(!!token);
    }, []);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isActive = (path) => location.pathname === path ? 'active' : '';
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    if (location.pathname === '/checkout') return null;

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setIsDropdownOpen(false);
        navigate('/');
        window.location.reload();
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // ... (rest of the component)

    return (
        <div className="navbar-container">
            {/* Promo Bar */}
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
                    {/* User Icon with Dropdown or Auth Modal */}
                    <div className="account-dropdown-container">
                        <div
                            onClick={isLoggedIn ? toggleDropdown : openAuth}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                            <User size={22} className="icon-btn" />
                        </div>

                        {isLoggedIn && isDropdownOpen && (
                            <div className="account-dropdown-menu">
                                <Link to="/account" className="account-dropdown-item" onClick={() => setIsDropdownOpen(false)}>Profile</Link>
                                <Link to="/orders" className="account-dropdown-item" onClick={() => setIsDropdownOpen(false)}>Orders</Link>
                                <div className="account-dropdown-divider"></div>
                                <div className="account-dropdown-item" onClick={handleLogout}>Logout</div>
                            </div>
                        )}
                    </div>

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
