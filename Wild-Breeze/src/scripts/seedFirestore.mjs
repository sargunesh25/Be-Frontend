// Firestore Data Seeding Script
// Run this script once to populate your Firestore with initial data
// Usage: node src/scripts/seedFirestore.mjs

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase config from environment variables
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample Products Data
const products = [
    {
        title: 'Teddy Bear Crew',
        price: 45.00,
        original_price: null,
        image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        is_sale: false,
        is_available: true,
        category: 'crews',
        created_at: Timestamp.now()
    },
    {
        title: 'Sardine Crew',
        price: 35.00,
        original_price: null,
        image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        is_sale: false,
        is_available: true,
        category: 'crews',
        created_at: Timestamp.now()
    },
    {
        title: 'Summer Breeze Tee',
        price: 28.00,
        original_price: 35.00,
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        is_sale: true,
        is_available: true,
        category: 'tees',
        created_at: Timestamp.now()
    },
    {
        title: 'Ocean Wave Hoodie',
        price: 65.00,
        original_price: null,
        image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        is_sale: false,
        is_available: true,
        category: 'hoodies',
        created_at: Timestamp.now()
    },
    {
        title: 'Mountain Peak Cap',
        price: 22.00,
        original_price: null,
        image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        is_sale: false,
        is_available: false,
        category: 'accessories',
        created_at: Timestamp.now()
    },
    {
        title: 'Vintage Rose Sweatshirt',
        price: 55.00,
        original_price: 70.00,
        image_url: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        is_sale: true,
        is_available: true,
        category: 'crews',
        created_at: Timestamp.now()
    }
];

// Hero Slides Data
const heroSlides = [
    {
        image_url: '/hero-background.png',
        promo_text: 'All orders $100+ ship for free!',
        title: 'Looking for something cozy?',
        subtitle: 'New arrivals are here!',
        sort_order: 1,
        is_active: true
    },
    {
        image_url: '/hero-bg-2.png',
        promo_text: 'New Arrivals: Check out our latest collection!',
        title: 'Summer Collection',
        subtitle: 'Fresh styles for sunny days',
        sort_order: 2,
        is_active: true
    }
];

// FAQs Data
const faqs = [
    {
        question: 'WHEN WILL MY ORDER SHIP?',
        answer: 'All orders that include a made-to-order item placed after 12/7 as well as ALL ORDERS placed after 12/11 will ship after January 1st! Made to order items include everything that is not listed in the Ready to Ship section (this includes state flower crews!). The standard processing time is 5-7 business days, but this timeline is subject to change as a lot of the items in my shop are made to order.',
        sort_order: 1
    },
    {
        question: 'WHAT SIZE SHOULD I ORDER?',
        answer: 'All state flower apparel is unisex, and therefore runs large. If you are looking for a wearable-oversized fit, go with your usual size. If you\'re looking for an extra cozy, more dramatically oversized fit, size up. If you want the sweatshirt to be more fitted, size down.',
        sort_order: 2
    },
    {
        question: 'DO YOU ACCEPT RETURNS/EXCHANGES?',
        answer: 'Sun Milk only accepts returns, not exchanges. If you would like an item in a different size, a separate order will need to be placed (a free shipping code will be provided for your re-order). All returns must be made within 30 days of the delivery date and the items must be returned in new, unworn condition with tags to be valid.',
        sort_order: 3
    },
    {
        question: 'OOPS, I ACCIDENTALLY ORDERED THE WRONG ITEM!',
        answer: 'While we do our best to accommodate changes should you make a mistake when placing your order, we are not responsible for orders that are shipped in accordance to what was ordered. All shipping expenses as a result of these mistakes are the responsibility of the customer.',
        sort_order: 4
    }
];

async function seedDatabase() {
    console.log('Starting database seeding...');

    try {
        // Seed Products
        console.log('\nSeeding products...');
        for (const product of products) {
            const docRef = await addDoc(collection(db, 'products'), product);
            console.log(`  Added product: ${product.title} (ID: ${docRef.id})`);
        }

        // Seed Hero Slides
        console.log('\nSeeding hero slides...');
        for (const slide of heroSlides) {
            const docRef = await addDoc(collection(db, 'hero_slides'), slide);
            console.log(`  Added slide: ${slide.title} (ID: ${docRef.id})`);
        }

        // Seed FAQs
        console.log('\nSeeding FAQs...');
        for (const faq of faqs) {
            const docRef = await addDoc(collection(db, 'faqs'), faq);
            console.log(`  Added FAQ: ${faq.question.substring(0, 30)}... (ID: ${docRef.id})`);
        }

        console.log('\n✅ Database seeding completed successfully!');
        console.log(`   - ${products.length} products added`);
        console.log(`   - ${heroSlides.length} hero slides added`);
        console.log(`   - ${faqs.length} FAQs added`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
