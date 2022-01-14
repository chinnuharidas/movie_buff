var express = require('express');
const adminHelpers = require('../helpers/admin-helpers');
var router = express.Router();
const ownerHelpers = require('../helpers/owner-helpers');
var hb = require('express-handlebars').create();

const isAdmin = true;
const adminTitle = 'Superadmin'
let active = 'dashboard'
let section = ''

router.use((req, res, next) => {
	if (!req.session.adminLoggedIn){
		res.redirect('/admin/login')
	}else{
		next()
	}
})

router.post('/', (req, res, next) => {
    const date = new Date();
	let currentMonth = date.getMonth() + 1;
	let currentYear = date.getFullYear();

    if (currentMonth < 10 ){
        currentMonth = '0' + currentMonth;
    }
    const month_start_date = parseInt(currentYear + '' + currentMonth + '' + '00' );
    const month_end_date = parseInt(currentYear + '' + currentMonth + '31');
    adminHelpers.getMovieWiseRevenue(month_start_date, month_end_date, currentYear).then((response) => {
        let movies = response.movies;
        let movieNameArr = movies.map(movie => movie.movieDetails.title);
        let totalRevenueArr = movies.map(movie => movie.totalRevenue);
        let screenNameArr = response.screens.map(screen => {
            return screen.theatreDetails.name + ' - ' + screen.name
        });

        let tr_theatreArr = response.tr_theatreArr
        let tr_revenueArr = response.tr_revenueArr
        res.send({ status : true, movieNameArr, totalRevenueArr, yearArray : response.yearArray, screenNameArr : screenNameArr, screenWiseRevenueArr : screenRevenue, tr_theatreArr, tr_revenueArr})
    })
})


module.exports = router;