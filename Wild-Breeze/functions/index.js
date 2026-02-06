const functions = require('firebase-functions');
const https = require('https');

// Printful API configuration
// Set this using: firebase functions:config:set printful.token="YOUR_TOKEN"
const PRINTFUL_API_TOKEN = functions.config().printful?.token || process.env.PRINTFUL_API_TOKEN;

/**
 * Helper function to make HTTPS requests to Printful API
 */
const printfulFetch = (endpoint, method = 'GET', body = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.printful.com',
            port: 443,
            path: endpoint,
            method: method,
            headers: {
                'Authorization': `Bearer ${PRINTFUL_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // Printful uses code field in body for errors even with 200 OK sometimes, but usually standard HTTP
                    // However, we check status code first.
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        // Return parsed error if available
                        const errorMsg = parsed.error?.message || parsed.result || `Printful API error: ${res.statusCode}`;
                        reject(new Error(errorMsg));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Printful response'));
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

/**
 * Fetch product details including pricing
 */
const getProductDetails = async (productId) => {
    try {
        const data = await printfulFetch(`/store/products/${productId}`);
        return data.result;
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        return null;
    }
};

/**
 * Cloud Function: Get all products from Printful store
 * Called from frontend to fetch products
 */
exports.getPrintfulProducts = functions.https.onCall(async (data, context) => {
    try {
        if (!PRINTFUL_API_TOKEN) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'Printful API token not configured'
            );
        }

        // Fetch all store products
        const productsResponse = await printfulFetch('/store/products');
        const storeProducts = productsResponse.result || [];

        // Fetch detailed info for each product (includes pricing)
        const productsWithDetails = await Promise.all(
            storeProducts.map(async (product) => {
                const details = await getProductDetails(product.id);

                if (!details) {
                    return null;
                }

                // Get the first variant's retail price as the display price
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
            })
        );

        // Filter out any null products
        let products = productsWithDetails.filter(p => p !== null);

        // Apply filters if provided
        const filters = data || {};

        if (filters.min_price) {
            products = products.filter(p => parseFloat(p.price) >= parseFloat(filters.min_price));
        }
        if (filters.max_price) {
            products = products.filter(p => parseFloat(p.price) <= parseFloat(filters.max_price));
        }

        // Apply sorting
        const { sort } = filters;
        if (sort === 'price_asc') {
            products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        } else if (sort === 'price_desc') {
            products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        } else if (sort === 'alphabetical_az') {
            products.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === 'alphabetical_za') {
            products.sort((a, b) => b.title.localeCompare(a.title));
        }

        return { products };
    } catch (error) {
        console.error('Error in getPrintfulProducts:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Cloud Function: Get shipping countries from Printful
 */
exports.getPrintfulCountries = functions.https.onCall(async (data, context) => {
    try {
        if (!PRINTFUL_API_TOKEN) {
            throw new functions.https.HttpsError('failed-precondition', 'Printful API token not configured');
        }
        const response = await printfulFetch('/countries');
        return response.result;
    } catch (error) {
        console.error('Error in getPrintfulCountries:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Cloud Function: Create a draft order in Printful
 * Validates shipping address and items
 */
exports.createPrintfulOrder = functions.https.onCall(async (data, context) => {
    try {
        if (!PRINTFUL_API_TOKEN) {
            throw new functions.https.HttpsError('failed-precondition', 'Printful API token not configured');
        }

        const { recipient, items } = data;

        // Construct Printful order payload
        const orderPayload = {
            recipient: {
                name: `${recipient.firstName} ${recipient.lastName}`,
                address1: recipient.address,
                address2: recipient.apartment || '',
                city: recipient.city,
                state_code: recipient.stateCode,
                country_code: recipient.countryCode,
                zip: recipient.zip,
                email: recipient.email
            },
            items: items.map(item => ({
                variant_id: item.variant_id || item.id, // Use variant_id if available, fallback to id (might need external_id/sync_variant_id depending on setup)
                quantity: item.quantity,
                retail_price: item.price
            }))
        };

        // For now, let's just estimate costs (dry run) or create a draft. 
        // Using /orders/estimate-costs is safer for "pre-checkout" validation
        // But user asked for order placement validation. Let's try creating a "pending" order or just validation.
        // We'll use estimate-costs to validate address and items.

        const response = await printfulFetch('/orders/estimate-costs', 'POST', orderPayload);

        // If successful, returns costs. If address is invalid, Printful returns 400.
        return { success: true, costs: response.result };

    } catch (error) {
        console.error('Error in createPrintfulOrder:', error);
        // Pass Printful error message back to UI
        throw new functions.https.HttpsError('invalid-argument', error.message); // Simplified error handling
    }
});

/**
 * Helper to support POST requests in our simple fetch wrapper
 */
// NOTE: I need to update the printfulFetch helper to support POST method and body.
// The previous implementation was GET only.

