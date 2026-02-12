// Test script to verify add to cart functionality
const API_BASE = 'http://127.0.0.1:8787';

async function testAddToCart() {
    console.log('=== Testing Add to Cart Functionality ===\n');

    // Step 1: Register a test user
    console.log('1. Registering test user...');
    try {
        const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'Test1234',
                firstName: 'Test',
                lastName: 'User'
            })
        });

        const registerData = await registerResponse.json();
        if (registerResponse.ok) {
            console.log('✓ User registered successfully:', registerData);
        } else {
            console.log('! Registration failed (user may already exist):', registerData.error);
        }
    } catch (error) {
        console.error('✗ Registration error:', error.message);
    }

    // Step 2: Login
    console.log('\n2. Logging in...');
    let token = null;
    try {
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'Test1234'
            })
        });

        const loginData = await loginResponse.json();
        if (loginResponse.ok) {
            token = loginData.token;
            console.log('✓ Login successful');
            console.log('  User:', loginData.user);
            console.log('  Token:', token.substring(0, 20) + '...');
        } else {
            console.error('✗ Login failed:', loginData.error);
            return;
        }
    } catch (error) {
        console.error('✗ Login error:', error.message);
        return;
    }

    // Step 3: Add item to cart
    console.log('\n3. Adding item to cart...');
    try {
        const addToCartResponse = await fetch(`${API_BASE}/api/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: 'test-product-123',
                quantity: 2
            })
        });

        const cartData = await addToCartResponse.json();
        if (addToCartResponse.ok) {
            console.log('✓ Item added to cart successfully:');
            console.log('  Cart Item:', cartData);
        } else {
            console.error('✗ Add to cart failed:', cartData.error);
            return;
        }
    } catch (error) {
        console.error('✗ Add to cart error:', error.message);
        return;
    }

    // Step 4: Get cart
    console.log('\n4. Fetching cart...');
    try {
        const getCartResponse = await fetch(`${API_BASE}/api/cart`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const cartItems = await getCartResponse.json();
        if (getCartResponse.ok) {
            console.log('✓ Cart fetched successfully:');
            console.log('  Items in cart:', cartItems.length);
            cartItems.forEach((item, index) => {
                console.log(`  ${index + 1}. Product: ${item.product_id} x ${item.quantity}`);
            });
        } else {
            console.error('✗ Get cart failed:', cartItems.error);
        }
    } catch (error) {
        console.error('✗ Get cart error:', error.message);
    }

    console.log('\n=== Test Complete ===');
}

testAddToCart().catch(console.error);
