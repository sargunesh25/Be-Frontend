/**
 * Wild-Breeze Cloudflare Workers API
 * Production-Grade Security Implementation
 */

// ==================== SECURITY HELPERS ====================

// Simple UUID generator for IDs
function generateId() {
    return crypto.randomUUID();
}

// Rate limiting store (in-memory, resets on worker restart)
const rateLimitStore = new Map();

// Rate limiter for login attempts
function checkRateLimit(ip, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const key = `login:${ip}`;
    const record = rateLimitStore.get(key);

    if (!record) {
        rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
        return { allowed: true, remaining: maxAttempts - 1 };
    }

    // Reset if window has passed
    if (now - record.firstAttempt > windowMs) {
        rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
        return { allowed: true, remaining: maxAttempts - 1 };
    }

    // Check if exceeded
    if (record.attempts >= maxAttempts) {
        const retryAfter = Math.ceil((record.firstAttempt + windowMs - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
    }

    record.attempts++;
    return { allowed: true, remaining: maxAttempts - record.attempts };
}

// Reset rate limit on successful login
function resetRateLimit(ip) {
    rateLimitStore.delete(`login:${ip}`);
}

// ==================== CORS & SECURITY HEADERS ====================

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'https://wild-breeze.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
];

function isAllowedOrigin(origin, env) {
    if (!origin) return false;

    // Check configured origin from env
    const configuredOrigin = env.CORS_ORIGIN;
    if (configuredOrigin === '*') return true;
    if (configuredOrigin && origin === configuredOrigin) return true;

    // Check against allowed list
    if (ALLOWED_ORIGINS.includes(origin)) return true;

    // Allow all Vercel preview/production domains
    if (origin.endsWith('.vercel.app')) return true;

    return false;
}

function corsHeaders(env, requestOrigin = null) {
    // Check if request origin is allowed
    if (requestOrigin && isAllowedOrigin(requestOrigin, env)) {
        return {
            'Access-Control-Allow-Origin': requestOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        };
    }

    // Default to configured origin
    const defaultOrigin = env.CORS_ORIGIN || 'https://wild-breeze.pages.dev';
    return {
        'Access-Control-Allow-Origin': defaultOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

function securityHeaders() {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://api.printful.com;",
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    };
}

// JSON response helper with security headers
function jsonResponse(data, status = 200, env = {}, requestOrigin = null) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(env, requestOrigin),
            ...securityHeaders()
        }
    });
}

// Error response helper - doesn't expose internal details
function errorResponse(message, status = 400, env = {}, requestOrigin = null) {
    return jsonResponse({ error: message }, status, env, requestOrigin);
}

// ==================== INPUT VALIDATION ====================

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // Minimum 8 characters, at least one letter and one number
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[a-zA-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
}

function sanitizeString(str, maxLength = 1000) {
    if (typeof str !== 'string') return '';
    // Remove potentially dangerous characters and limit length
    return str.slice(0, maxLength).replace(/[<>]/g, '');
}

function truncateString(str, num) {
    if (!str) return '';
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + '...';
}

// ==================== SECURE PASSWORD HASHING (PBKDF2) ====================

async function hashPassword(password) {
    const encoder = new TextEncoder();

    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );

    // Derive key using PBKDF2 with 100,000 iterations
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );

    // Combine salt and hash for storage
    const hashArray = new Uint8Array(derivedBits);
    const combined = new Uint8Array(salt.length + hashArray.length);
    combined.set(salt);
    combined.set(hashArray, salt.length);

    return btoa(String.fromCharCode(...combined));
}

async function verifyPassword(password, storedHash) {
    try {
        const encoder = new TextEncoder();

        // Decode the stored hash
        const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));

        // Extract salt (first 16 bytes) and hash (remaining bytes)
        const salt = combined.slice(0, 16);
        const storedHashBytes = combined.slice(16);

        // Import password as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );

        // Derive key using same parameters
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            256
        );

        const newHashBytes = new Uint8Array(derivedBits);

        // Constant-time comparison to prevent timing attacks
        if (newHashBytes.length !== storedHashBytes.length) return false;
        let result = 0;
        for (let i = 0; i < newHashBytes.length; i++) {
            result |= newHashBytes[i] ^ storedHashBytes[i];
        }
        return result === 0;
    } catch {
        return false;
    }
}

// ==================== JWT IMPLEMENTATION ====================

async function createJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
    const payloadB64 = btoa(JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    })).replace(/=/g, '');

    const signatureInput = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureInput));
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return `${headerB64}.${payloadB64}.${signatureB64}`;
}

async function verifyJWT(token, secret) {
    try {
        const [headerB64, payloadB64, signatureB64] = token.split('.');
        const encoder = new TextEncoder();

        const signatureInput = `${headerB64}.${payloadB64}`;
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(signatureInput));

        if (!valid) return null;

        const payload = JSON.parse(atob(payloadB64));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null; // Token expired
        }

        return payload;
    } catch {
        return null;
    }
}

// ==================== AUTH MIDDLEWARE ====================

async function authenticateRequest(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('JWT_SECRET not configured');
        return null;
    }

    const token = authHeader.substring(7);
    return await verifyJWT(token, jwtSecret);
}

// Get client IP for rate limiting
function getClientIP(request) {
    return request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0] ||
        'unknown';
}

// ==================== ROUTER ====================

class Router {
    constructor() {
        this.routes = [];
    }

    add(method, path, handler) {
        this.routes.push({ method, path, handler });
    }

    get(path, handler) { this.add('GET', path, handler); }
    post(path, handler) { this.add('POST', path, handler); }
    put(path, handler) { this.add('PUT', path, handler); }
    delete(path, handler) { this.add('DELETE', path, handler); }

    async handle(request, env, ctx) {
        const url = new URL(request.url);
        const method = request.method;
        const path = url.pathname;
        const requestOrigin = request.headers.get('Origin');

        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    ...corsHeaders(env, requestOrigin),
                    ...securityHeaders()
                }
            });
        }

        for (const route of this.routes) {
            if (route.method === method) {
                const match = this.matchPath(route.path, path);
                if (match) {
                    try {
                        return await route.handler(request, env, ctx, match.params, url.searchParams);
                    } catch (error) {
                        console.error('Route error:', error);
                        return errorResponse('An error occurred', 500, env, requestOrigin);
                    }
                }
            }
        }

        return errorResponse('Not found', 404, env, requestOrigin);
    }

    matchPath(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length !== pathParts.length) return null;

        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].substring(1)] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }

        return { params };
    }
}

// Create router and define routes
const router = new Router();

// ==================== AUTH ROUTES ====================

router.post('/api/auth/register', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');

    let body;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Invalid request body', 400, env, requestOrigin);
    }

    const { email, password, firstName, lastName } = body;

    // Validate email
    if (!email || !validateEmail(email)) {
        return errorResponse('Valid email is required', 400, env, requestOrigin);
    }

    // Validate password
    if (!password) {
        return errorResponse('Password is required', 400, env, requestOrigin);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        return errorResponse(passwordValidation.message, 400, env, requestOrigin);
    }

    // Check if user exists
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
    if (existing) {
        return errorResponse('Email already registered', 400, env, requestOrigin);
    }

    const id = generateId();
    const passwordHash = await hashPassword(password);

    await env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, email.toLowerCase(), passwordHash, sanitizeString(firstName || ''), sanitizeString(lastName || '')).run();

    return jsonResponse({ id, email: email.toLowerCase() }, 201, env, requestOrigin);
});

router.post('/api/auth/login', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');
    const clientIP = getClientIP(request);

    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
        return jsonResponse(
            { error: 'Too many login attempts. Please try again later.' },
            429,
            env,
            requestOrigin
        );
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Invalid request body', 400, env, requestOrigin);
    }

    const { email, password } = body;

    if (!email || !password) {
        return errorResponse('Email and password are required', 400, env, requestOrigin);
    }

    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
    if (!user) {
        return errorResponse('Invalid credentials', 401, env, requestOrigin);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
        return errorResponse('Invalid credentials', 401, env, requestOrigin);
    }

    // Check for JWT secret - FAIL if not configured
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('CRITICAL: JWT_SECRET not configured');
        return errorResponse('Authentication service unavailable', 503, env, requestOrigin);
    }

    // Reset rate limit on successful login
    resetRateLimit(clientIP);

    const token = await createJWT({ userId: user.id, email: user.email }, jwtSecret);

    return jsonResponse({
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name
        }
    }, 200, env, requestOrigin);
});

// ==================== PRODUCTS ROUTES ====================

router.get('/api/products', async (request, env, ctx, params, query) => {
    const requestOrigin = request.headers.get('Origin');

    let products = await env.DB.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    let results = products.results || [];

    // Apply filters
    const availability = query.get('availability');
    if (availability === 'in_stock') {
        results = results.filter(p => p.is_available === 1);
    } else if (availability === 'out_of_stock') {
        results = results.filter(p => p.is_available === 0);
    }

    const category = query.get('category');
    if (category) {
        results = results.filter(p => p.category === category);
    }

    const minPrice = query.get('min_price');
    if (minPrice) {
        results = results.filter(p => parseFloat(p.price) >= parseFloat(minPrice));
    }

    const maxPrice = query.get('max_price');
    if (maxPrice) {
        results = results.filter(p => parseFloat(p.price) <= parseFloat(maxPrice));
    }

    // Apply sorting
    const sort = query.get('sort');
    if (sort === 'price_asc') {
        results.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sort === 'price_desc') {
        results.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sort === 'alphabetical_az') {
        results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'alphabetical_za') {
        results.sort((a, b) => b.title.localeCompare(a.title));
    }

    // Transform for frontend compatibility
    results = results.map(p => ({
        ...p,
        is_available: p.is_available === 1,
        is_sale: p.is_sale === 1
    }));

    return jsonResponse(results, 200, env, requestOrigin);
});

// ==================== HERO SLIDES ROUTES ====================

router.get('/api/hero-slides', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');

    const slides = await env.DB.prepare(
        'SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();

    const results = (slides.results || []).map(s => ({
        ...s,
        is_active: s.is_active === 1
    }));

    return jsonResponse(results, 200, env, requestOrigin);
});

// ==================== FAQs ROUTES ====================

router.get('/api/faqs', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');
    const faqs = await env.DB.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
    return jsonResponse(faqs.results || [], 200, env, requestOrigin);
});

// ==================== CONTACT ROUTES ====================

router.post('/api/contact', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');

    let body;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Invalid request body', 400, env, requestOrigin);
    }

    const { name, email, message } = body;

    // Validate inputs
    if (!message || message.trim().length === 0) {
        return errorResponse('Message is required', 400, env, requestOrigin);
    }

    if (email && !validateEmail(email)) {
        return errorResponse('Invalid email format', 400, env, requestOrigin);
    }

    const id = generateId();
    await env.DB.prepare(
        'INSERT INTO contact_messages (id, name, email, message) VALUES (?, ?, ?, ?)'
    ).bind(id, sanitizeString(name || ''), email || '', sanitizeString(message)).run();

    return jsonResponse({ success: true, message: 'Message received' }, 201, env, requestOrigin);
});

// ==================== CART ROUTES ====================

router.get('/api/cart', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');
    const user = await authenticateRequest(request, env);
    if (!user) {
        return errorResponse('Unauthorized', 401, env, requestOrigin);
    }

    const cartItems = await env.DB.prepare(`
        SELECT id, quantity, product_id, created_at
        FROM cart_items
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).bind(user.userId).all();

    return jsonResponse(cartItems.results || [], 200, env, requestOrigin);
});

router.post('/api/cart', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');
    const user = await authenticateRequest(request, env);
    if (!user) {
        return errorResponse('Unauthorized', 401, env, requestOrigin);
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Invalid request body', 400, env, requestOrigin);
    }

    const { productId, quantity = 1, title, price, imageUrl, selectedSize, selectedColor } = body;
    console.log("Add to cart:", body);

    if (!productId) {
        return errorResponse('Product ID is required', 400, env, requestOrigin);
    }

    // Check if item exists in cart
    const existing = await env.DB.prepare(
        'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?'
    ).bind(user.userId, productId.toString()).first();

    if (existing) {
        // Update quantity
        await env.DB.prepare(
            'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?'
        ).bind(quantity, existing.id).run();
        return jsonResponse({ id: existing.id, quantity: existing.quantity + quantity }, 200, env, requestOrigin);
    } else {
        // Add new item (simple version)
        const id = generateId();
        await env.DB.prepare(
            'INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)'
        ).bind(
            id,
            user.userId,
            productId.toString(),
            quantity
        ).run();
        return jsonResponse({ id, productId, quantity }, 201, env, requestOrigin);
    }
});

router.delete('/api/cart/:productId', async (request, env, ctx, params) => {
    const requestOrigin = request.headers.get('Origin');
    const user = await authenticateRequest(request, env);
    if (!user) {
        return errorResponse('Unauthorized', 401, env, requestOrigin);
    }

    await env.DB.prepare(
        'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?'
    ).bind(user.userId, params.productId).run();

    return jsonResponse({ message: 'Item removed' }, 200, env, requestOrigin);
});

router.post('/api/cart/merge', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');
    const user = await authenticateRequest(request, env);
    if (!user) {
        return errorResponse('Unauthorized', 401, env, requestOrigin);
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Invalid request body', 400, env, requestOrigin);
    }

    const { guestCart } = body;

    if (Array.isArray(guestCart)) {
        for (const item of guestCart) {
            if (!item.product_id) continue;

            const existing = await env.DB.prepare(
                'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?'
            ).bind(user.userId, item.product_id.toString()).first();

            if (existing) {
                await env.DB.prepare(
                    'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?'
                ).bind(item.quantity || 1, existing.id).run();
            } else {
                const id = generateId();
                await env.DB.prepare(
                    'INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)'
                ).bind(
                    id,
                    user.userId,
                    item.product_id.toString(),
                    item.quantity || 1
                ).run();
            }
        }
    }

    // Return updated cart
    const cartItems = await env.DB.prepare(`
        SELECT id, quantity, product_id, created_at
        FROM cart_items
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).bind(user.userId).all();

    return jsonResponse(cartItems.results || [], 200, env, requestOrigin);
});

// ==================== ORDER ROUTES ====================

router.post('/api/orders', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');
    const user = await authenticateRequest(request, env);
    if (!user) {
        return errorResponse('Unauthorized', 401, env, requestOrigin);
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Invalid request body', 400, env, requestOrigin);
    }

    const { shippingAddress, contactNumber } = body;

    // Get cart items
    const cartItemsResult = await env.DB.prepare(`
        SELECT * FROM cart_items WHERE user_id = ?
    `).bind(user.userId).all();

    const cartItems = cartItemsResult.results || [];

    if (cartItems.length === 0) {
        return errorResponse('Cart is empty', 400, env, requestOrigin);
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderId = generateId();

    try {
        // Start transaction (D1 doesn't support explicit transactions in all modes, but we'll adapt)
        // Insert order
        await env.DB.prepare(`
            INSERT INTO orders (id, user_id, total_amount, shipping_address, contact_number, status, payment_status)
            VALUES (?, ?, ?, ?, ?, 'pending', 'pending')
        `).bind(orderId, user.userId, totalAmount, JSON.stringify(shippingAddress), contactNumber).run();

        // Insert order items
        const stmt = env.DB.prepare(`
            INSERT INTO order_items (id, order_id, product_id, quantity, title, price, image_url, selected_size, selected_color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Batch execution would be better but doing loop for simplicity with current bindings
        for (const item of cartItems) {
            await stmt.bind(
                generateId(),
                orderId,
                item.product_id,
                item.quantity,
                item.title,
                item.price,
                item.image_url,
                item.selected_size,
                item.selected_color
            ).run();
        }

        // Clear cart
        await env.DB.prepare('DELETE FROM cart_items WHERE user_id = ?').bind(user.userId).run();

        return jsonResponse({
            id: orderId,
            message: 'Order placed successfully',
            totalAmount
        }, 201, env, requestOrigin);

    } catch (error) {
        console.error('Order creation failed:', error);
        return errorResponse('Failed to place order', 500, env, requestOrigin);
    }
});

router.get('/api/orders', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');
    const user = await authenticateRequest(request, env);
    if (!user) {
        return errorResponse('Unauthorized', 401, env, requestOrigin);
    }

    const orders = await env.DB.prepare(`
        SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
    `).bind(user.userId).all();

    // Parse shipping address if it's a string
    const results = (orders.results || []).map(order => {
        try {
            return {
                ...order,
                shipping_address: typeof order.shipping_address === 'string'
                    ? JSON.parse(order.shipping_address)
                    : order.shipping_address
            };
        } catch {
            return order;
        }
    });

    return jsonResponse(results, 200, env, requestOrigin);
});

router.get('/api/orders/:id', async (request, env, ctx, params) => {
    const requestOrigin = request.headers.get('Origin');
    const user = await authenticateRequest(request, env);
    if (!user) {
        return errorResponse('Unauthorized', 401, env, requestOrigin);
    }

    const order = await env.DB.prepare(`
        SELECT * FROM orders WHERE id = ? AND user_id = ?
    `).bind(params.id, user.userId).first();

    if (!order) {
        return errorResponse('Order not found', 404, env, requestOrigin);
    }

    const items = await env.DB.prepare(`
        SELECT * FROM order_items WHERE order_id = ?
    `).bind(order.id).all();

    try {
        order.shipping_address = typeof order.shipping_address === 'string'
            ? JSON.parse(order.shipping_address)
            : order.shipping_address;
    } catch { }

    return jsonResponse({
        ...order,
        items: items.results || []
    }, 200, env, requestOrigin);
});

// ==================== SUBSCRIBE ROUTES ====================

router.post('/api/subscribe', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');

    let body;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Invalid request body', 400, env, requestOrigin);
    }

    const { phoneNumber } = body;

    if (!phoneNumber || phoneNumber.trim().length === 0) {
        return errorResponse('Phone number is required', 400, env, requestOrigin);
    }

    // Basic phone number validation (digits, spaces, dashes, plus allowed)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
        return errorResponse('Invalid phone number format', 400, env, requestOrigin);
    }

    // Check if already exists
    const existing = await env.DB.prepare(
        'SELECT id FROM discount_signups WHERE phone_number = ?'
    ).bind(cleanPhone).first();

    if (!existing) {
        const id = generateId();
        await env.DB.prepare(
            'INSERT INTO discount_signups (id, phone_number) VALUES (?, ?)'
        ).bind(id, cleanPhone).run();
    }

    return jsonResponse({ message: 'Discount activated!', discountActive: true }, 200, env, requestOrigin);
});

// ==================== PRINTFUL PROXY ROUTES ====================

router.get('/api/printful/products', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');
    const printfulToken = env.PRINTFUL_API_TOKEN;

    if (!printfulToken) {
        return errorResponse('Printful API not configured', 500, env, requestOrigin);
    }

    try {
        // Fetch all store products
        const productsResponse = await fetch('https://api.printful.com/store/products', {
            headers: {
                'Authorization': `Bearer ${printfulToken}`,
                'Content-Type': 'application/json'
            }
        });

        const productsData = await productsResponse.json();
        const storeProducts = productsData.result || [];

        // Fetch detailed info for each product
        const productsWithDetails = await Promise.all(
            storeProducts.map(async (product) => {
                try {
                    const detailsResponse = await fetch(`https://api.printful.com/store/products/${product.id}`, {
                        headers: {
                            'Authorization': `Bearer ${printfulToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    const detailsData = await detailsResponse.json();
                    const details = detailsData.result;

                    if (!details) return null;

                    const variants = details.sync_variants || [];
                    const firstVariant = variants[0];
                    const price = firstVariant?.retail_price || '0.00';

                    return {
                        id: product.id.toString(),
                        title: product.name,
                        image_url: product.thumbnail_url,
                        price: parseFloat(price).toFixed(2),
                        is_available: true,
                        is_sale: false,
                        original_price: null,
                        printful_id: product.id,
                        external_id: product.external_id,
                        variants: variants.map(v => ({
                            id: v.id,
                            name: v.name,
                            price: v.retail_price,
                            sku: v.sku
                        }))
                    };
                } catch {
                    return null;
                }
            })
        );

        const products = productsWithDetails.filter(p => p !== null);
        return jsonResponse({ products }, 200, env, requestOrigin);
    } catch (error) {
        console.error('Printful API error:', error);
        return errorResponse('Failed to fetch products', 500, env, requestOrigin);
    }
});

// Health check
router.get('/api/health', async (request, env) => {
    const requestOrigin = request.headers.get('Origin');
    return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    }, 200, env, requestOrigin);
});

// Main export
export default {
    async fetch(request, env, ctx) {
        return router.handle(request, env, ctx);
    }
};
