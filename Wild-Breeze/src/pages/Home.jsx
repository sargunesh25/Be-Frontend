
import React from 'react';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';
import FeatureSection from '../components/FeatureSection';
import CategorySplit from '../components/CategorySplit';
import KeplarCollection from '../components/KeplarCollection';

const Home = ({ setPromoText }) => {
    return (
        <>
            <Hero setPromoText={setPromoText} />
            <div id="product-section">
                <ProductGrid />
            </div>
            <FeatureSection />
            <CategorySplit />
            <KeplarCollection />
        </>
    );
};

export default Home;
