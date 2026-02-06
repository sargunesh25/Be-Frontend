/**
 * Wild-Breeze Cloudflare Workers API
 * Replaces Firebase backend with Cloudflare Workers + D1
 */

// Simple UUID generator for IDs
function generateId() {
    return crypto.randomUUID();
}

// CORS headers helper
function corsHeaders(origin = '*') {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

// JSON response helper
function jsonResponse(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
            ...headers
        }
    });
}

// Error response helper
function errorResponse(message, status = 400) {
    return jsonResponse({ error: message }, status);
}

// Simple password hashing using Web Crypto API
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'wild-breeze-salt');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function verifyPassword(password, hash) {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

// JWT implementation using Web Crypto API
async function createJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
    const payloadB64 = btoa(JSON.stringify({
        ...payload,
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

// Auth middleware
async function authenticateRequest(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    const jwtSecret = env.JWT_SECRET || 'default-dev-secret';
    return await verifyJWT(token, jwtSecret);
}

// Router
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

        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders() });
        }

        for (const route of this.routes) {
            if (route.method === method) {
                const match = this.matchPath(route.path, path);
                if (match) {
                    try {
                        return await route.handler(request, env, ctx, match.params, url.searchParams);
                    } catch (error) {
                        console.error('Route error:', error);
                        return errorResponse('Internal server error', 500);
                    }
                }
            }
        }

        return errorResponse('Not found', 404);
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
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password) {
        return errorResponse('Email and password are required');
    }

    // Check if user exists
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
        return errorResponse('Email already registered');
    }

    const id = generateId();
    const passwordHash = await hashPassword(password);

    await env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, email, passwordHash, firstName || '', lastName || '').run();

    return jsonResponse({ id, email }, 201);
});

router.post('/api/auth/login', async (request, env) => {
    const { email, password } = await request.json();

    if (!email || !password) {
        return errorResponse('Email and password are required');
    }

    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) {
        return errorResponse('Invalid credentials', 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
        return errorResponse('Invalid credentials', 401);
    }

    const jwtSecret = env.JWT_SECRET || 'default-dev-secret';
    const token = await createJWT({ userId: user.id, email: user.email }, jwtSecret);

    return jsonResponse({
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name
        }
    });
});

// ==================== PRODUCTS ROUTES ====================

router.get('/api/products', async (request, env, ctx, params, query) => {
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

    return jsonResponse(results);
});

// ==================== HERO SLIDES ROUTES ====================

router.get('/api/hero-slides', async (request, env) => {
    const slides = await env.DB.prepare(
        'SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();

    const results = (slides.results || []).map(s => ({
        ...s,
        is_active: s.is_active === 1
    }));

    return jsonResponse(results);
});

// ==================== FAQs ROUTES ====================

router.get('/api/faqs', async (request, env) => {
    const faqs = await env.DB.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
    return jsonResponse(faqs.results || []);
});

// ==================== CONTACT ROUTES ====================

router.post('/api/contact', async (request, env) => {
    const { name, email, message } = await request.json();

    const id = generateId();
    await env.DB.prepare(
        'INSERT INTO contact_messages (id, name, email, message) VALUES (?, ?, ?, ?)'
    ).bind(id, name || '', email || '', message || '').run();

    return jsonResponse({ success: true, message: 'Message received' }, 201);
});

// ==================== CART ROUTES ====================

router.get('/api/cart', async (request, env) => {
    const user = await authenticateRequest(request, env);
    if (!user) {
        return errorResponse('Unauthorized', 401);
    }

    const cartItems = await env.DB.prepare(`
        SELECT ci.id, ci.quantity, ci.product_id, p.title, p.price, p.image_url
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `).bind(user.userId).all();

    return jsonResponse(cartItems.results || []);
});

router.post('/api/cart', async (request, env) => {
    const user = await authenticateRequest(request, env);
    if (!user) {
        return errorResponse('Unauthorized', 401);
    }

    const { productId, quantity = 1 } = await request.json();

    // Check if item exists in cart
    const existing = await env.DB.prepare(
        'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?'
    ).bind(user.userId, productId.toString()).first();

    if (existing) {
        // Update quantity
        await env.DB.prepare(
            'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?'
        ).bind(quantity, existing.id).run();
        return jsonResponse({ id: existing.id, quantity: existing.quantity + quantity });
    } else {
        // Add new item
        const id = generateId();
        await env.DB.prepare(
            'INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)'
        ).bind(id, user.userId, productId.toString(), quantity).run();
        return jsonResponse({ id, productId, quantity }, 201);
    }
});

router.delete('/api/cart/:productId', async (request, env, ctx, params) => {
    const user = await authenticateRequest(request, env);
    if (!user) {
        return errorResponse('Unauthorized', 401);
    }

    await env.DB.prepare(
        'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?'
    ).bind(user.userId, params.productId).run();

    return jsonResponse({ message: 'Item removed' });
});

router.post('/api/cart/merge', async (request, env) => {
    const user = await authenticateRequest(request, env);
    if (!user) {
        return errorResponse('Unauthorized', 401);
    }

    const { guestCart } = await request.json();

    if (Array.isArray(guestCart)) {
        for (const item of guestCart) {
            const existing = await env.DB.prepare(
                'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?'
            ).bind(user.userId, item.product_id.toString()).first();

            if (existing) {
                await env.DB.prepare(
                    'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?'
                ).bind(item.quantity, existing.id).run();
            } else {
                const id = generateId();
                await env.DB.prepare(
                    'INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)'
                ).bind(id, user.userId, item.product_id.toString(), item.quantity).run();
            }
        }
    }

    // Return updated cart
    const cartItems = await env.DB.prepare(`
        SELECT ci.id, ci.quantity, ci.product_id, p.title, p.price, p.image_url
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `).bind(user.userId).all();

    return jsonResponse(cartItems.results || []);
});

// ==================== SUBSCRIBE ROUTES ====================

router.post('/api/subscribe', async (request, env) => {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
        return errorResponse('Phone number is required');
    }

    // Check if already exists
    const existing = await env.DB.prepare(
        'SELECT id FROM discount_signups WHERE phone_number = ?'
    ).bind(phoneNumber).first();

    if (!existing) {
        const id = generateId();
        await env.DB.prepare(
            'INSERT INTO discount_signups (id, phone_number) VALUES (?, ?)'
        ).bind(id, phoneNumber).run();
    }

    return jsonResponse({ message: 'Discount activated!', discountActive: true });
});

// ==================== PRINTFUL PROXY ROUTES ====================

router.get('/api/printful/products', async (request, env) => {
    const printfulToken = env.PRINTFUL_API_TOKEN;

    if (!printfulToken) {
        return errorResponse('Printful API not configured', 500);
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
        return jsonResponse({ products });
    } catch (error) {
        return errorResponse('Failed to fetch Printful products', 500);
    }
});

// Health check
router.get('/api/health', async () => {
    return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main export
export default {
    async fetch(request, env, ctx) {
        return router.handle(request, env, ctx);
    }
};
