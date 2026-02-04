const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const { name, email, message } = req.body;
    // Here logic would go to send email or save to DB
    console.log('Contact form received:', { name, email, message });
    res.json({ success: true, message: 'Message received' });
});

module.exports = router;
