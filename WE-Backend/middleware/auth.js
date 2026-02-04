const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        // Remove 'Bearer ' prefix if present
        const tokenString = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Auth Error:', err.message);
        console.error('Received Token:', token);
        res.status(401).json({ error: 'Token is not valid' });
    }
};
