const API_URL = 'http://localhost:5000/api/v1';

async function verifyBackend() {
    try {
        console.log('=== 1. Testing Auth ===');
        const email = `test_${Date.now()}@example.com`;
        const password = 'password123';

        // Register/Login Helper
        const post = async (endpoint, body, token = null) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`POST ${endpoint} failed: ${res.status} ${txt}`);
            }
            return res.json();
        };

        const get = async (endpoint, params = {}) => {
            const url = new URL(`${API_URL}${endpoint}`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
            return res.json();
        };

        // Register
        try {
            console.log(`Registering user: ${email}`);
            await post('/auth/register', { email, password });
            console.log('Registered.');
        } catch (e) {
            console.log('Register failed (maybe exists):', e.message);
        }

        console.log('Logging in...');
        const loginData = await post('/auth/login', { email, password });
        const token = loginData.token;
        console.log('Got Token:', token ? 'YES' : 'NO');

        console.log('\n=== 2. Testing Add to Cart ===');
        // Use product ID 1 (Teddy Bear Crew)
        const cartData = await post('/cart', { productId: 1, quantity: 2 }, token);
        console.log('Added to Cart Result:', JSON.stringify(cartData, null, 2));

        console.log('\n=== 3. Testing Filters (Out of Stock) ===');
        const products = await get('/products', { availability: 'out_of_stock' });
        console.log(`Found ${products.length} out-of-stock items.`);
        products.forEach(p => console.log(` - ${p.title} (Available: ${p.is_available})`));

        console.log('\n=== VERIFICATION COMPLETE ===');

    } catch (err) {
        console.error('Verification Failed:', err.message);
    }
}

verifyBackend();
