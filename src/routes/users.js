const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.send('respond with a resource');
});

module.exports = router;