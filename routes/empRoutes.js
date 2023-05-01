const empController = require('../controllers/emp.controller');
const middlewareController = require('../middleware/middlewareController');

const router = require('express').Router();

router.get('/employees', middlewareController.verifyTokenAndAdminAuth, empController.getAllEmp);
router.get('/employees', middlewareController.verifyTokenAndAdminAuth, empController.addEmp);
router.delete('/employee', middlewareController.verifyTokenAndAdminAuth, empController.deleteEmp);

module.exports = router;
