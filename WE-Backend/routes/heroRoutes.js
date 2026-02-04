const express = require('express');
const router = express.Router();
const heroController = require('../controllers/heroController');

router.get('/', heroController.getHeroSlides);

module.exports = router;
