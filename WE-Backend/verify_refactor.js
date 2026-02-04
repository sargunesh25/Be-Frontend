const API_URL = 'http://localhost:5000/api/v1';

async function testRefactor() {
    try {
        console.log('1. Testing Subscribe (Refactored)...');
        const phone = '99' + Math.floor(Math.random() * 100000000);

        const subRes = await fetch(`${API_URL}/auth/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone })
        });

        const subData = await subRes.json();
        console.log('   Response:', subData);

        if (subData.token) {
            console.error('❌ FAILED: Subscribe returned a token! It should NOT.');
        } else if (subData.discountActive) {
            console.log('✅ Subscribe Success: No token, discount active.');
        } else {
            console.error('❌ FAILED: Unexpected response', subData);
        }

        console.log('\n2. Testing Login & Merge Cart...');
        // Login with a known user (or create one)
        // Let's create a temp user to be safe
        const email = `test${Date.now()}@example.com`;
        const password = 'password123';

        console.log(`   - Registering temp user ${email}`);
        await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName: 'Test', lastName: 'User' })
        });

        // Login
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        if (!token) {
            console.error('❌ Login failed (no token)');
            return;
        }

        console.log('   - Merging items...');
        const cartItemsToMerge = [
            { product_id: 1, quantity: 5 } // specific ID
        ];

        const mergeRes = await fetch(`${API_URL}/cart/merge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ guestCart: cartItemsToMerge })
        });

        const mergedCart = await mergeRes.json();
        console.log('   Merge Result:', mergedCart);

        const mergedItem = mergedCart.find(i => i.product_id === 1);
        if (mergedItem && mergedItem.quantity >= 5) {
            console.log('✅ Merge Success: Item found in user cart.');
        } else {
            console.error('❌ Merge Failed.');
        }

    } catch (error) {
        console.error('❌ Error in test flow:', error);
    }
}

testRefactor();
