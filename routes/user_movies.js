var express = require('express');
const userHelpers = require('../helpers/user-helpers');
const masterHelpers = require('../helpers/master-helpers')
var router = express.Router();
require('dotenv').config();
var hb = require('express-handlebars').create();

const userTitle = "MovieBuff"
const isUser = true

router.post('/review_like/:id', (req, res, next) => {
	if (req.session.userId){
		userHelpers.likeMovieReview(req.params.id, req.session.userId).then((response) => {
			res.send({ status : true, likes : response.likes, dislikes : response.dislikes });
		})
	}else{
		res.send( { status : false, errorMsg : 'Login to Continue'} )
	}
})

router.post('/review_dislike/:id', (req, res, next) => {
	if (req.session.userId){
		userHelpers.dislikeMovieReview(req.params.id, req.session.userId).then((response) => {
			res.send({ status : true, likes : response.likes, dislikes : response.dislikes });
		})
	}else{
		res.send( { status : false, errorMsg : 'Login to Continue'} )
	}
})


router.get('/search_movie', function (req, res, next) {
	let dateObj = new Date();

	let month = dateObj.getUTCMonth() + 1;
	let day = dateObj.getUTCDate();
	if (day < 10){
		day = '0' + day;
	}
	let year = dateObj.getUTCFullYear();

	if (month < 10){
		month = '0' + month;
	}
	const currentDate = year + '' + month + '' + day;

	masterHelpers.getActiveMovieLanguages(parseInt(currentDate)).then((languages) => {
		masterHelpers.getMovieGenres().then((genres) => {
			masterHelpers.getMoviesWithTheatres(parseInt(year + '' + month + '' + day) ).then((movies) => {
				let languageArr = [];
				for (var i=0; i< languages.movieDbLanguages.length; i++){
					if (languageArr.indexOf(languages.movieDbLanguages[i]._id.language) == -1){
						languageArr.push(languages.movieDbLanguages[i]._id.language);
					}
				}
		
				for (var i=0; i< languages.addedLanguages.length; i++){
					if (languageArr.indexOf(languages.addedLanguages[i]._id) == -1){
						languageArr.push(languages.addedLanguages[i]._id);
					}
				}
		
				res.render('user/movie-search', { 
					title: userTitle, 
					isUser, 
					section: 'movies', 
					languages : languageArr, 
					genres, movies, 
					isUserLoggedIn: req.session.isUserLoggedIn,
					user_name: req.session.user_name
				} );
			});
		});
	})
});



router.get('/upcoming_list', function (req, res, next) {
	let dateObj = new Date();

	let month = dateObj.getUTCMonth() + 1;
	let day = dateObj.getUTCDate();
	if (day < 10){
		day = '0' + day;
	}
	let year = dateObj.getUTCFullYear();

	if (month < 10){
		month = '0' + month;
	}

	masterHelpers.getUpcomingMovies(parseInt(year + '' + month + '' + day) ).then((upcoming) => {
		console.log(upcoming)
		res.render('user/upcoming-movies', { 
			title: userTitle, 
			isUser, 
			section: 'movies',
			upcoming, 
			isUserLoggedIn: req.session.isUserLoggedIn,
			user_name: req.session.user_name
		} );
	});
});

router.post('/movie_filter', function (req, res, next) {

	let dateObj = new Date();

	if (dateObj.getHours() == 0 ){
		dateObj.setDate(dateObj.getDate()+1)
	}

	let month = dateObj.getUTCMonth() + 1;
	let day = dateObj.getUTCDate();
	if (day < 10){
		day = '0' + day;
	}
	let year = dateObj.getUTCFullYear();


	if (month < 10){
		month = '0' + month;
	}
	const currentDate = parseInt(year + '' + month + '' + day);

    masterHelpers.getMoviesWithFilters(currentDate, req.body['languageArr[]'], req.body['genreArr[]'], req.body.search_movie_input).then((movies) => {

		hb.render('views/user/movie_list_part.hbs', { 
			movies
		}).then((listRenderHtml) => {
			hb.render('views/user/movie_grid_part.hbs', { 
				movies
			}).then((gridRenderHtml) => {
				res.send({ list : listRenderHtml, grid :  gridRenderHtml });
			});
		})

    })

});


router.get('/search_movie_name', function (req, res, next) {
	let dateObj = new Date();

	let month = dateObj.getUTCMonth() + 1;
	let day = dateObj.getUTCDate();
	if (day < 10){
		day = '0' + day;
	}
	let year = dateObj.getUTCFullYear();

	if (month < 10){
		month = '0' + month;
	}
	const currentDate = year + '' + month + '' + day;

	masterHelpers.getActiveMovieLanguages(parseInt(currentDate)).then((languages) => {
		masterHelpers.getMovieGenres().then((genres) => {
			masterHelpers.getMoviesWithFilters(parseInt(year + '' + month + '' + day), [], [],  req.query.name ).then((movies) => {
				let languageArr = [];
				for (var i=0; i< languages.movieDbLanguages.length; i++){
					if (languageArr.indexOf(languages.movieDbLanguages[i]._id.language) == -1){
						languageArr.push(languages.movieDbLanguages[i]._id.language);
					}
				}
		
				for (var i=0; i< languages.addedLanguages.length; i++){
					if (languageArr.indexOf(languages.addedLanguages[i]._id) == -1){
						languageArr.push(languages.addedLanguages[i]._id);
					}
				}
				let search_movie = req.query.name;
				res.render('user/movie-search', { title: userTitle, 
					isUser, 
					section: 'movies', 
					languages : languageArr, 
					genres, 
					movies, 
					search_movie, 
					isUserLoggedIn: req.session.isUserLoggedIn, 
					user_name: req.session.user_name } );
			});
		});
	})
});


router.post('/get_location/:id', (req, res, next) => {
	res.send(req.params.id)
})

module.exports = router;