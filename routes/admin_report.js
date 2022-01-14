var express = require('express');
const adminHelpers = require('../helpers/admin-helpers');
const masterHelpers = require('../helpers/master-helpers');
var router = express.Router();
const ownerHelpers = require('../helpers/owner-helpers');
var hb = require('express-handlebars').create();

const isAdmin = true;
const adminTitle = 'Superadmin'
let active = 'report'
let section = ''

router.use((req, res, next) => {
	if (!req.session.adminLoggedIn){
		res.redirect('/admin/login')
	}else{
		next()
	}
})

router.get('/', function (req, res, next) {
    active = 'report'
    section = 'report'
    adminHelpers.getEnabledMovies().then((movies) => {
        masterHelpers.getEnabledScreens().then((screens) => {
            adminHelpers.getRevenues(null).then((results) => {
                res.render('admin/report/list', { results, screens, movies, section, active, isAdmin, title: adminTitle + ' - Report' })
            })
        })
    })
});

router.post('/get_report', function (req, res, next) {
    adminHelpers.getRevenues(req.body).then((results) => {
        res.send(results)
    })
});

module.exports = router;