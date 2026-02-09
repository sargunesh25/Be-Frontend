import React from 'react';
import './FAQ.css';

const FAQ = () => {
    return (
        <div className="faq-page">
            <div className="faq-container">
                <h1 className="faq-title">Frequently Asked Questions</h1>

                <div className="faq-section">
                    <h2 className="faq-question">WHEN WILL MY ORDER SHIP?</h2>
                    <p className="faq-answer">
                        All orders that include a made-to-order item placed after 12/7 as well as <span className="bold-italic">ALL ORDERS placed after 12/11 will ship after January 1st!</span> Made to order items include everything that is not listed in the Ready to Ship section (<span className="bold-italic">this includes state flower crews!</span>). The standard processing time is 5-7 business days, but this timeline is subject to change as a lot of the items in my shop are made to order. Orders that include multiple items with different processing times will not ship until the entire order is complete — This includes pre-orders. Please note that this does not include the time it takes for your order to arrive once shipped from my studio in Milwaukee, WI. If you need your order by a certain date, I encourage you to leave a note and I will do my best to accommodate.
                    </p>
                </div>

                <div className="faq-section">
                    <h2 className="faq-question">WHAT SIZE SHOULD I ORDER?</h2>
                    <p className="faq-answer">
                        All state flower apparel is unisex, and therefore runs large. If you are looking for a wearable-oversized fit, go with your usual size. If you're looking for an extra cozy, more dramatically oversized fit, size up. If you want the sweatshirt to be more fitted, size down. All listings include a detailed size chart, so please check the measurements carefully before purchasing and don't hesitate to reach out if you are still unsure!
                    </p>
                </div>

                <div className="faq-section">
                    <h2 className="faq-question">DO YOU ACCEPT RETURNS/EXCHANGES?</h2>
                    <p className="faq-answer">
                        Wild Breeze only accepts returns, not exchanges. If you would like an item in a different size, a separate order will need to be placed (a free shipping code will be provided for your re-order 😊). All returns must be made within 30 days of the delivery date and the items must be returned in new, unworn condition with tags to be valid. Prior approval is required. Shipping expenses are at the cost of the customer and are not included in the refunded amount. If there is a problem with your order, please reach out to wildbreezeshop@gmail.com.
                    </p>
                </div>

                <div className="faq-section">
                    <h2 className="faq-question">OOPS, I ACCIDENTALLY ORDERED THE WRONG ITEM!</h2>
                    <p className="faq-answer">
                        While we do our best to accommodate changes should you make a mistake when placing your order, we are not responsible for orders that are shipped in accordance to what was ordered (i.e. you ordered a small crew, but meant to order a medium. A small crew was shipped). All shipping expenses as a result of these mistakes are the responsibility of the customer.
                    </p>
                </div>

                <div className="faq-section">
                    <h2 className="faq-question">MY PACKAGE SAYS IT'S BEEN DELIVERED, BUT I DON'T HAVE IT. WHAT SHOULD I DO?</h2>
                    <p className="faq-answer">
                        Sometimes, packages are marked as delivered prematurely and often times show up within the next few days. If it doesn't turn up, I'd suggest checking with neighbors, confirming that you entered the correct shipping address, and/or inquiring at your local post office for additional tracking information. To file a claim with USPS for a lost domestic package, go <a href="https://www.usps.com/help/claims.htm" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>here</a>. Wild Breeze is not responsible for lost or stolen packages.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
