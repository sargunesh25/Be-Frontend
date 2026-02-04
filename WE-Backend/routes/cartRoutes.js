const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');

router.get('/', auth, cartController.getCart);
router.post('/', auth, cartController.addToCart);
router.post('/merge', auth, cartController.mergeCart);
router.delete('/:productId', auth, cartController.removeFromCart);

module.exports = router;
