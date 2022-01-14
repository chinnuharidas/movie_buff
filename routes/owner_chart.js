var express = require('express');
var router = express.Router();
const ownerHelpers = require('../helpers/owner-helpers');
var hb = require('express-handlebars').create();

const isOwner = true;
const ownerTitle = 'Theatre Owner'
let active = 'dashboard'
let section = ''

router.use((req, res, next) => {
    if (req.session.isOwnerLoggedIn){
        next()
    }else{
        res.redirect('/owner/login')
    }
})

router.post('/', (req, res, next) => {
    const date = new Date();
	let currentMonth = date.getMonth() + 1;
	const currentYear = date.getFullYear();

    if (currentMonth < 10 ){
        currentMonth = '0' + currentMonth;
    }
    const month_start_date = parseInt(currentYear + '' + currentMonth + '' + '00' );
    const month_end_date = parseInt(currentYear + '' + currentMonth + '31');
    ownerHelpers.getMovieWiseRevenue(req.session.owneruser._id, month_start_date, month_end_date, currentYear).then((response) => {
        let movies = response.movies;
        let movieNameArr = movies.map(movie => movie.movieDetails.title);
        let totalRevenueArr = movies.map(movie => movie.totalRevenue);
        let screenNameArr = response.screens.map(screen => screen.name);
        res.send({ status : true, movieNameArr, totalRevenueArr, yearArray : response.yearArray, screenNameArr : screenNameArr, screenWiseRevenueArr : screenRevenue})
    })
})


module.exports = router;