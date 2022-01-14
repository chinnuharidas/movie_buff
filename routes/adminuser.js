var express = require('express');
const masterHelpers = require('../helpers/master-helpers');
var router = express.Router();

const isAdmin = true;
const adminTitle = 'Superadmin'
let active = 'dashboard'
let section = ''

router.get('/', function (req, res, next) {
	const errorMsg = req.session.errorMsg;
	req.session.errorMsg = null
	const successMsg = req.session.successMsg;
	req.session.successMsg = null
	active = 'user'
	section = 'user'
	masterHelpers.getUsers().then((theatres) => {
		res.render('admin/user/list', { errorMsg, successMsg, theatres, section, active, isAdmin, title : adminTitle + ' - Users' })
	})
});

router.post('/statusUpdForm/:status/:id', function (req, res, next) {
	masterHelpers.getUserById(req.params.id).then((response) => {
		if (response.status){
			const user = response.result;
			res.render('admin/user/status_update_form', {layout : false, user, status : req.params.status });
		}
	});
});

router.post('/enable/:id', function (req, res, next) {
	masterHelpers.doEnableUser(req.params.id, req.body.status_update_remarks).then((response) => {
		if (response.status){
			req.session.successMsg = 'User enabled'
			res.redirect('/admin/user')
		}else{
			req.session.errorMsg = response.errorMsg
			res.redirect('/admin/user')
		}
	})
});

router.post('/disable/:id', function (req, res, next) {
	masterHelpers.doDisableUser(req.params.id, req.body.status_update_remarks).then((response) => {
		if (response.status){
			req.session.successMsg = 'User disabled'
			res.redirect('/admin/user')
		}else{
			req.session.errorMsg = response.errorMsg
			res.redirect('/admin/user')
		}
	})
});

module.exports = router;