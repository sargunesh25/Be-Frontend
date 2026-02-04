const API_URL = 'http://localhost:5000/api/v1';

async function testFlow() {
    try {
        console.log('1. Testing Subscribe...');
        const phone = '99' + Math.floor(Math.random() * 100000000);
        console.log(`   - Subscribing with ${phone}`);

        const subRes = await fetch(`${API_URL}/auth/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone })
        });

        if (!subRes.ok) {
            console.error('❌ Subscribe Failed:', await subRes.text());
            return;
        }

        const subData = await subRes.json();
        const token = subData.token;

        if (!token) {
            console.error('❌ FAILED: No token received from subscribe');
            return;
        }
        console.log('✅ Subscribe Success. Token received.');

        console.log('2. Testing Add to Cart...');
        const productsRes = await fetch(`${API_URL}/products`);
        const products = await productsRes.json();
        const productId = products[0].id;
        console.log(`   - Adding product ID ${productId}`);

        const cartRes = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId: productId, quantity: 2 })
        });

        if (!cartRes.ok) {
            console.error('❌ Add to Cart Failed:', await cartRes.text());
            return;
        }
        console.log('✅ Add to Cart Success:', await cartRes.json());

        console.log('3. Verifying Cart Contents...');
        const verifyRes = await fetch(`${API_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const cartItems = await verifyRes.json();
        if (cartItems.length > 0 && cartItems[0].product_id === productId && cartItems[0].quantity === 2) {
            console.log('✅ Verification Success: Item found in cart.');
        } else {
            console.error('❌ Verification Failed: Cart mismatch', cartItems);
        }

    } catch (error) {
        console.error('❌ Error in test flow:', error);
    }
}

testFlow();
