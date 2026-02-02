
import React from 'react';
import { User, ShoppingBag, Search, ChevronDown, Wind } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    return (
        <div className="navbar-container">
            <div className="promo-bar">
                All orders $100+ ship for free!
            </div>

            <div className="main-header">
                <div className="header-left">
                    <Search size={20} className="icon-btn" />
                </div>

                <div className="site-title icon-title-wrapper">
                    <Wind size={32} className="title-icon" />
                    <span>Wild breeze</span>
                </div>

                <div className="header-right">
                    <User size={22} className="icon-btn" />
                    <ShoppingBag size={22} className="icon-btn" />
                </div>
            </div>

            <nav className="nav-bar">
                <ul className="nav-links">
                    <li><a className="nav-item active">Home</a></li>
                    <li><a className="nav-item">Ready to Ship</a></li>
                    <li>
                        <a className="nav-item">
                            Shop <ChevronDown size={14} />
                        </a>
                    </li>
                    <li><a className="nav-item">Contact</a></li>
                    <li><a className="nav-item">About Us</a></li>
                    <li><a className="nav-item">FAQ</a></li>
                    <li><a className="nav-item">Events</a></li>
                </ul>
            </nav>
        </div>
    );
};

export default Navbar;
