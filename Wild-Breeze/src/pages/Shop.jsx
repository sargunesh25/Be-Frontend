import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ShoppingBag } from 'lucide-react';
import './Shop.css';
import '../components/ProductGrid.css'; // Reuse product grid styles
import { getProducts } from '../services/api';
import { useCart } from '../context/CartContext';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [filters, setFilters] = useState({
        availability: '', // 'in_stock', 'out_of_stock'
        priceRange: '',   // '0-50', '50-100', '100+'
        sort: 'alphabetical_az'
    });

    // Dropdown Visibility State
    const [openDropdown, setOpenDropdown] = useState(null); // 'availability', 'price', 'sort'

    const wrapperRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);


    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Construct API params from state
                const apiParams = {};

                if (filters.sort) apiParams.sort = filters.sort;
                if (filters.availability) apiParams.availability = filters.availability;

                if (filters.priceRange === '0-50') {
                    apiParams.max_price = 50;
                } else if (filters.priceRange === '50-100') {
                    apiParams.min_price = 50;
                    apiParams.max_price = 100;
                } else if (filters.priceRange === '100-plus') {
                    apiParams.min_price = 100;
                }

                const data = await getProducts(apiParams);

                // Client-side sort backup as requested by user
                // This ensures correct order even if backend is quirky with casing/nulls
                let sortedData = [...data];
                if (filters.sort === 'alphabetical_az') {
                    sortedData.sort((a, b) => a.title.localeCompare(b.title));
                } else if (filters.sort === 'alphabetical_za') {
                    sortedData.sort((a, b) => b.title.localeCompare(a.title));
                }
                // Price sorting is already robust in backend, but can add here if needed.

                setProducts(sortedData);
            } catch (error) {
                console.error('Failed to load products', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setOpenDropdown(null); // Close dropdown after selection
    };

    const toggleDropdown = (name) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };

    const { addToCart } = useCart();

    const handleAddToCart = (product) => {
        addToCart(product);
    };

    const getSortLabel = (value) => {
        switch (value) {
            case 'alphabetical_az': return 'Alphabetically, A-Z';
            case 'alphabetical_za': return 'Alphabetically, Z-A';
            case 'price_asc': return 'Price, low to high';
            case 'price_desc': return 'Price, high to low';
            case 'date_new_old': return 'Date, new to old';
            case 'date_old_new': return 'Date, old to new';
            default: return 'Alphabetically, A-Z';
        }
    };

    return (
        <div className="shop-page" ref={wrapperRef}>
            <h1 className="shop-title">Products</h1>

            <div className="shop-toolbar">
                <div className="filter-group">
                    <span className="toolbar-label">Filter:</span>

                    {/* Availability Dropdown */}
                    <div className="dropdown-container">
                        <div className={`dropdown-trigger ${filters.availability ? 'active' : ''}`} onClick={() => toggleDropdown('availability')}>
                            Availability <ChevronDown size={14} />
                        </div>
                        {openDropdown === 'availability' && (
                            <div className="dropdown-menu">
                                <div className="dropdown-item" onClick={() => handleFilterChange('availability', '')}>All</div>
                                <div className="dropdown-item" onClick={() => handleFilterChange('availability', 'in_stock')}>In Stock</div>
                                <div className="dropdown-item" onClick={() => handleFilterChange('availability', 'out_of_stock')}>Out of Stock</div>
                            </div>
                        )}
                    </div>

                    {/* Price Dropdown */}
                    <div className="dropdown-container">
                        <div className={`dropdown-trigger ${filters.priceRange ? 'active' : ''}`} onClick={() => toggleDropdown('price')}>
                            Price <ChevronDown size={14} />
                        </div>
                        {openDropdown === 'price' && (
                            <div className="dropdown-menu">
                                <div className="dropdown-item" onClick={() => handleFilterChange('priceRange', '')}>All</div>
                                <div className="dropdown-item" onClick={() => handleFilterChange('priceRange', '0-50')}>Under $50</div>
                                <div className="dropdown-item" onClick={() => handleFilterChange('priceRange', '50-100')}>$50 - $100</div>
                                <div className="dropdown-item" onClick={() => handleFilterChange('priceRange', '100-plus')}>$100+</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sort-group">
                    <span className="toolbar-label">Sort by:</span>
                    <div className="dropdown-container">
                        <div className="dropdown-trigger" onClick={() => toggleDropdown('sort')}>
                            {getSortLabel(filters.sort)} <ChevronDown size={14} />
                        </div>
                        {openDropdown === 'sort' && (
                            <div className="dropdown-menu right-aligned">
                                <div className="dropdown-item" onClick={() => handleFilterChange('sort', 'alphabetical_az')}>Alphabetically, A-Z</div>
                                <div className="dropdown-item" onClick={() => handleFilterChange('sort', 'alphabetical_za')}>Alphabetically, Z-A</div>
                                <div className="dropdown-item" onClick={() => handleFilterChange('sort', 'price_asc')}>Price, low to high</div>
                                <div className="dropdown-item" onClick={() => handleFilterChange('sort', 'price_desc')}>Price, high to low</div>
                                <div className="dropdown-item" onClick={() => handleFilterChange('sort', 'date_new_old')}>Date, new to old</div>
                                <div className="dropdown-item" onClick={() => handleFilterChange('sort', 'date_old_new')}>Date, old to new</div>
                            </div>
                        )}
                    </div>
                    <span className="product-count">{products.length} products</span>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading products...</div>
            ) : products.length === 0 ? (
                <div className="no-products">No products found matching your filters.</div>
            ) : (
                <div className="product-grid">
                    {products.map((product) => (
                        <Link to={`/product/${product.id}`} key={product.id} className="product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="product-image-container">
                                {product.is_sale && <span className="sale-badge">Sale</span>}
                                <img src={product.image_url || 'https://via.placeholder.com/300'} alt={product.title} className="product-image" />
                            </div>
                            <div className="product-title">{product.title}</div>
                            <div className="product-price">
                                {product.is_sale && <span className="original-price">${product.original_price}</span>}
                                ${product.price}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Shop;
