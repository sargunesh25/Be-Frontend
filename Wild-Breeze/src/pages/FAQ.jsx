import React, { useState, useEffect } from 'react';
import './FAQ.css';
import { getFAQs } from '../services/api';

const FAQ = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const data = await getFAQs();
                setFaqs(data);
            } catch (error) {
                console.error('Error fetching FAQs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFAQs();
    }, []);

    if (loading) {
        return (
            <div className="faq-page">
                <div className="faq-container">
                    <h1 className="faq-title">Frequently Asked Questions</h1>
                    <div className="faq-loading">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="faq-page">
            <div className="faq-container">
                <h1 className="faq-title">Frequently Asked Questions</h1>

                {faqs.map((faq) => (
                    <div key={faq.id} className="faq-section">
                        <h2 className="faq-question">{faq.question}</h2>
                        <p className="faq-answer">{faq.answer}</p>
                    </div>
                ))}

                {faqs.length === 0 && !loading && (
                    <p className="no-faqs">No FAQs available at this time.</p>
                )}
            </div>
        </div>
    );
};

export default FAQ;
