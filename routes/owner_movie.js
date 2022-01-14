var express = require('express');
var router = express.Router();
const ownerHelpers = require('../helpers/owner-helpers');
const masterHelpers = require('../helpers/master-helpers');
var hb = require('express-handlebars').create();
require('dotenv').config();
const movieTrailer = require( 'movie-trailer' );

const movieDbApi = process.env.MOVIEDB_API;
const mdb = require('moviedb')(movieDbApi);

const MovieDb = require('moviedb-promise')
const moviedb = new MovieDb(movieDbApi)

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

router.get('/', function (req, res, next) {
	const errorMsg = req.session.errorMsg;
	req.session.errorMsg = null
	const successMsg = req.session.successMsg;
	req.session.successMsg = null
	active = 'movie'
	section = 'movie'
	ownerHelpers.getMoviesByTheatre(req.session.owneruser._id).then((movies) => {
		res.render('owner/movie/list', { errorMsg, successMsg, movies, section, active, isOwner, title: ownerTitle + ' - Movie List' })
	})
});

router.get('/add', function (req, res, next) {
	active = 'movie'
	section = 'movie'
	res.render('owner/movie/add', { section, active, isOwner, title: ownerTitle + ' - Movie Add' })
});

router.post('/search', async (req, res, next) => {
	await mdb.searchMovie({ query: req.body.movie_name }, (err, apiRes) => {
		if (err){

		}else{
			if (apiRes.results) {
					let movieResults = apiRes.results;
					if (movieResults.length > 0){
						hb.render('views/owner/movie/details.hbs', { result: movieResults }).then((renderedHtml) => {
							res.send({ status: true, view: renderedHtml })
						});
					}else{
						res.send({ status: false })
					}
			} else {
				res.send({ status: false })
			}
		}
	});
});

router.post('/add', async function (req, res, next) {

	let formData = req.body;
	const findMovie = async (api_movie_id) => {
		const movieRes = await moviedb.movieInfo({ id: api_movie_id })
		return movieRes
	}		

	try {
		findMovie(formData.api_movie_id).then(async (movie) => {
			await moviedb.movieImages({ id: formData.api_movie_id }).then(async (movieResponse) => {
				movie.images = movieResponse;

				await moviedb.movieCredits({id : formData.api_movie_id }).then(async (credit) => {
					movie.credits = credit;
					await moviedb.movieVideos({ id : formData.api_movie_id }).then(async (videos) => {
						if (videos){
							if (videos.results.length > 0){
								movie.trailer = videos.results[0]
							}
						}
						await ownerHelpers.addMovieToTheatre(req.session.owneruser._id, formData, movie).then((response) => {
							if (!response.status) {
								req.session.errorMsg = response.errorMsg;
							}
							res.redirect('/owner/movie')
						});
					});
				});
			})
		});
	} catch (e) {
		res.redirect('/owner/movie')
	}
});

router.post('/view/:id', function (req, res, next) {
	ownerHelpers.getMovieInfo(req.params.id).then(async (response) => {
		if (response.status){
			const movie = response.movie;
			if (movie.api_movie_id == '0'){
				movie.posterUploaded = await masterHelpers.getMovieUploadedImage(req.params.id);
				movie.backdropUploaded = await masterHelpers.getMovieUploadedBackdrop(req.params.id);
			}
			res.render('owner/movie/view', {layout : false, movie });
		}
	});
});

router.post('/disable/:id', function (req, res, next) {
	ownerHelpers.disableMovie(req.params.id).then((response) => {
		res.send(true);
	})
});

router.post('/enable/:id', function (req, res, next) {
	ownerHelpers.enableMovie(req.params.id).then((response) => {
		if (!response.status){
			req.session.errorMsg = response.errorMsg;
		}
		res.send(true);
	})
});

router.get('/add_new', function (req, res, next) {
	active = 'movie'
	section = 'movie'
	masterHelpers.getMovieGenres().then((genres) => {
		masterHelpers.getMovieLanguages().then((languages) => {
			res.render('owner/movie/new_add', { languages, genres, section, active, isOwner, title: ownerTitle + ' - Movie Add' })
		})
	})
});

router.post('/add_new', function (req, res, next) {
	let formData = req.body;
	ownerHelpers.doOwnerNewMovieAdd(formData, req.session.owneruser._id)
		.then((response) => {
			res.redirect('/owner/movie')
		})
});

router.post('/imgform/:id', function (req, res, next) {
	ownerHelpers.getMovieInfo(req.params.id).then((response) => {
		if (response.status){
			const movie = response.movie; 
			res.render('owner/movie/imgform', {layout : false, movie, isOwner });
		}
	});
});

const { storage } = require('../config/connection')
const multer = require('multer');

let upload = null;

storage.on('connection', (db) => {
	upload = multer({
		storage: storage,
		fileFilter: function (req, file, cb) {
			if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg' ) {
				req.fileValidationError = 'goes wrong on the mimetype';
				return cb(null, false, new Error('goes wrong on the mimetype'));
			}
			cb(null, true);
		}
	}).single('movie_image');
});

router.post('/imgupload/:id', async function (req, res, next) {
	const movie_id = req.params.id;
	let status = true;
	let file_id = null;

	await upload(req, res, (err) => {
		if (req.fileValidationError) {
			status = false;
			req.session.errorMsg = "Upload an image file"
		}else if (err) {
			status = false;
			req.session.errorMsg = "Image uploading error"
		} else {
			file_id = res.req.file.id
			ownerHelpers.doMovieImageUpload(movie_id, file_id).then((response) => {
				if (response.status) {
					req.session.successMsg = "Image uploading success"
				} else {
					req.session.errorMsg = "Image uploading error"
				}
			})
		}
		res.redirect('/owner/movie')
	})
});

router.post('/backdrop/:id', function (req, res, next) {
	ownerHelpers.getMovieInfo(req.params.id).then((response) => {
		if (response.status){
			const movie = response.movie; 
			res.render('owner/movie/backdropform', {layout : false, movie, isOwner });
		}
	});
});

router.post('/backdropupload/:id', async function (req, res, next) {
	const movie_id = req.params.id;
	let status = true;
	let file_id = null;

	await upload(req, res, (err) => {
		if (req.fileValidationError) {
			status = false;
			req.session.errorMsg = "Upload an image file"
		}else if (err) {
			status = false;
			req.session.errorMsg = "Image uploading error"
		} else {
			file_id = res.req.file.id
			ownerHelpers.doMovieBackdropUpload(movie_id, file_id).then((response) => {
				if (response.status) {
					req.session.successMsg = "Image uploading success"
				} else {
					req.session.errorMsg = "Image uploading error"
				}
			})
		}
		res.redirect('/owner/movie')
	})
});

module.exports = router;