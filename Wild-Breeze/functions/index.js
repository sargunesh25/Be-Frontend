const functions = require('firebase-functions');
const https = require('https');

// Printful API configuration
// Set this using: firebase functions:config:set printful.token="YOUR_TOKEN"
const PRINTFUL_API_TOKEN = functions.config().printful?.token || process.env.PRINTFUL_API_TOKEN;

/**
 * Helper function to make HTTPS requests to Printful API
 */
const printfulFetch = (endpoint) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.printful.com',
            port: 443,
            path: endpoint,
            method: 'GET',
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
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`Printful API error: ${res.statusCode}`));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Printful response'));
                }
            });
        });

        req.on('error', reject);
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
