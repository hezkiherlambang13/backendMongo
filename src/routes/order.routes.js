const express = require('express');
const { bookPackage } = require('../controllers/order.controller');
const auth = require('../middlewares/auth.middleware');
const roleCheck = require('../middlewares/roleCheck.middleware');

const router = express.Router();

router.use(auth);
router.post('/book', roleCheck('customer'), bookPackage);

module.exports = router;