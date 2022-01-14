var express = require('express');
const adminHelpers = require('../helpers/admin-helpers');
const masterHelpers = require('../helpers/master-helpers');
var router = express.Router();

const isAdmin = true;
const adminTitle = 'Superadmin'
let active = 'reviews'
let section = ''

router.use((req, res, next) => {
    if (!req.session.adminLoggedIn){
		res.redirect('/admin/login')
	}else{
		next()
	}
})

router.get('/', function (req, res, next) {
	const errorMsg = req.session.errorMsg;
	req.session.errorMsg = null
	const successMsg = req.session.successMsg;
	req.session.successMsg = null
	active = 'reviews'
	section = 'reviews'
	masterHelpers.getReviews().then((reviews) => {
        console.log(reviews)
		res.render('admin/review/list', { errorMsg, successMsg, reviews, section, active, isAdmin, title : adminTitle + ' - Reviews' })
	})
});

router.post('/disverify/:id', function (req, res, next) {
    adminHelpers.disverifyReview(req.params.id).then((response) => {
        res.send(true)
    })
});

router.post('/verify/:id', function (req, res, next) {
    adminHelpers.verifyReview(req.params.id).then((response) => {
        res.send(true)
    })
});

router.post('/deactive/:id', function (req, res, next) {
    adminHelpers.deactiveReview(req.params.id).then((response) => {
        res.send(true)
    })
});

router.post('/active/:id', function (req, res, next) {
    adminHelpers.activeReview(req.params.id).then((response) => {
        res.send(true)
    })
});


module.exports = router;