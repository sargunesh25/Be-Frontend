// Test script to verify backend functionality including Orders
const API_BASE = 'http://127.0.0.1:8787';

async function testBackend() {
    console.log('=== Testing Backend Functionality ===\n');

    // Generate random email to avoid collision
    const randomId = Math.floor(Math.random() * 10000);
    const email = `test${randomId}@example.com`;
    const password = 'Test1234';

    // Step 1: Register a test user
    console.log(`1. Registering test user (${email})...`);
    let userId;
    try {
        const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                firstName: 'Test',
                lastName: 'User'
            })
        });

        const registerData = await registerResponse.json();
        if (registerResponse.ok) {
            console.log('✓ User registered successfully:', registerData);
            userId = registerData.id;
        } else {
            console.error('✗ Registration failed:', registerData.error);
            return;
        }
    } catch (error) {
        console.error('✗ Registration error:', error.message);
        return;
    }

    // Step 2: Login
    console.log('\n2. Logging in...');
    let token = null;
    try {
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const loginData = await loginResponse.json();
        if (loginResponse.ok) {
            token = loginData.token;
            console.log('✓ Login successful');
            // console.log('  Token:', token.substring(0, 20) + '...');
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
                quantity: 2,
                title: 'Test Product',
                price: 29.99,
                imageUrl: 'https://example.com/image.jpg',
                selectedSize: 'M',
                selectedColor: 'Blue'
            })
        });

        const cartData = await addToCartResponse.json();
        if (addToCartResponse.ok) {
            console.log('✓ Item added to cart successfully');
        } else {
            console.error('✗ Add to cart failed:', cartData.error);
            return;
        }
    } catch (error) {
        console.error('✗ Add to cart error:', error.message);
        return;
    }

    // Step 4: Place Order
    console.log('\n4. Placing Order...');
    let orderId;
    try {
        const orderResponse = await fetch(`${API_BASE}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                shippingAddress: {
                    street: '123 Test St',
                    city: 'Test City',
                    zip: '12345'
                },
                contactNumber: '+1234567890'
            })
        });

        const orderData = await orderResponse.json();
        if (orderResponse.ok) {
            console.log('✓ Order placed successfully:', orderData);
            orderId = orderData.id;
        } else {
            console.error('✗ Place order failed:', orderData.error);
            return;
        }
    } catch (error) {
        console.error('✗ Place order error:', error.message);
        return;
    }

    // Step 5: Get Orders
    console.log('\n5. Fetching Orders...');
    try {
        const getOrdersResponse = await fetch(`${API_BASE}/api/orders`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const orders = await getOrdersResponse.json();
        if (getOrdersResponse.ok) {
            console.log(`✓ Orders fetched successfully: Found ${orders.length} orders`);
            if (orders.length > 0) {
                console.log('  First Order:', orders[0]);
            }
        } else {
            console.error('✗ Get orders failed:', orders.error);
        }
    } catch (error) {
        console.error('✗ Get orders error:', error.message);
    }

    // Step 6: Get Order Details
    if (orderId) {
        console.log(`\n6. Fetching Order Details for ${orderId}...`);
        try {
            const getOrderResponse = await fetch(`${API_BASE}/api/orders/${orderId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const order = await getOrderResponse.json();
            if (getOrderResponse.ok) {
                console.log('✓ Order details fetched successfully');
                console.log('  Items in order:', order.items?.length);
            } else {
                console.error('✗ Get order details failed:', order.error);
            }
        } catch (error) {
            console.error('✗ Get order details error:', error.message);
        }
    }

    console.log('\n=== Test Complete ===');
}

testBackend().catch(console.error);
