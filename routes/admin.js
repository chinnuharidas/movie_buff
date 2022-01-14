var express = require('express');
var router = express.Router();
const adminHelpers = require('../helpers/admin-helpers');
const masterHelpers = require('../helpers/master-helpers');
var hb = require('express-handlebars').create();

const { storage } = require('../config/connection')
var db = require('../config/connection')
const multer = require('multer');

const isAdmin = true;
const adminTitle = 'Superadmin'
let active = 'dashboard'
let section = ''

const alphabet_arr = [
	'',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z'
];

let upload = null;

storage.on('connection', (db) => {
	upload = multer({
		storage: storage
	}).single('theatre_image');
});

/* GET home page. */
router.get('/login', function (req, res, next) {
	if (req.session.adminLoggedIn){
		res.redirect('/admin')
	}
	res.render('admin/login', {title : adminTitle + ' - Login', isAdminLogin : true});
});

router.post('/login', function (req, res, next) {
	adminHelpers.doAdminLogin(req.body).then((response) => {
		if (response.status) {
			req.session.adminuser = response.adminuser
			req.session.adminLoggedIn = true
			res.redirect('/admin')
		} else {
			req.session.adminLoginErr = "Invalid Username or Password"
			res.redirect('/admin/login')
		}
	})
});

router.use((req, res, next) => {
	if (!req.session.adminLoggedIn){
		res.redirect('/admin/login')
	}else{
		next()
	}
})

router.get('/', function (req, res, next) {
	active = 'dashboard'
	section = 'dashboard'
	const date = new Date();
	const currentMonth = date.getMonth() + 1;
	const currentYear = date.getFullYear();
	res.render('admin/dashboard', { 
		active, 
		isAdmin, 
		currentMonth,
		currentYear,
		dashboard : true,
		title : adminTitle + ' - Dashboard' });
});

router.get('/theatre/:status', function (req, res, next) {
	const errorMsg = req.session.errorMsg;
	req.session.errorMsg = null
	const successMsg = req.session.successMsg;
	req.session.successMsg = null
	active = 'theatre-' + req.params.status
	section = 'theatre'
	masterHelpers.getTheatres(req.params.status).then((theatres) => {
		res.render('admin/theatre/list', { errorMsg, successMsg, theatres, section, active, isAdmin, title : adminTitle + ' - Theatres' })
	})
});

router.get('/theatre/profile/:id', function (req, res, next) {
	const errorMsg = req.session.errorMsg;
	req.session.errorMsg = null
	const successMsg = req.session.successMsg;
	req.session.successMsg = null

	masterHelpers.getTheatreById(req.params.id).then((response) => {
		if (response.status){
			masterHelpers.getEnabledScreensByTheatre(req.params.id).then((screens) => {
				adminHelpers.getTodaysTheatreShows(req.params.id).then((showResults) => {
					const theatre = response.result; 
					active = 'theatre-' + theatre.status
					section = 'theatre'
					res.render('admin/theatre/profile', { shows : showResults.shows, screens, errorMsg, successMsg, theatre, section, active, isAdmin, title : adminTitle + ' - Theatres' })
				})
			})
		}else{
			req.session.errorMsg = 'No record found.'
			res.redirect('/admin/theatre/pending')
		}
	})
});


router.post('/theatre/imgform/:id', function (req, res, next) {
	masterHelpers.getTheatreById(req.params.id).then((response) => {
		if (response.status){
			const theatre = response.result; 
			res.render('admin/theatre/imgform', {layout : false, theatre });
		}
	});
});

router.post('/theatre/profilepicform/:id', function (req, res, next) {
	masterHelpers.getTheatreById(req.params.id).then((response) => {
		if (response.status){
			const theatre = response.result; 
			res.render('admin/theatre/profilepicform', {layout : false, theatre });
		}
	});
});



router.post('/theatre/imgupload/:id', function (req, res, next) {
	const theatre_id = req.params.id;
	upload(req, res, (err) => {
		if (err) {
			req.session.errorMsg = "Image uploading error"
		}else{
			masterHelpers.doTheatreImageUpload(theatre_id, res.req.file.id).then((response) => {
				if (response.status){
					req.session.successMsg = "Image uploading success"
				}else{
					req.session.errorMsg = "Image uploading error"
				}
			})
		}
		res.redirect('/admin/theatre/profile/' + theatre_id)
	});
});

router.post('/theatre/profilepicupload/:id', function (req, res, next) {
	const theatre_id = req.params.id;
	upload(req, res, (err) => {
		if (err) {
			req.session.errorMsg = "Image uploading error"
		}else{
			masterHelpers.doTheatreProfileUpload(theatre_id, res.req.file.id).then((response) => {
				if (response.status){
					req.session.successMsg = "Profile Pic uploading success"
				}else{
					req.session.errorMsg = "Profile Pic uploading error"
				}
			})
		}
		res.redirect('/admin/theatre/profile/' + theatre_id)
	});
});

router.post('/theatre/statusUpdForm/:status/:id', function (req, res, next) {
	masterHelpers.getTheatreById(req.params.id).then((response) => {
		if (response.status){
			const theatre = response.result;
			res.render('admin/theatre/status_update_form', {layout : false, theatre, status : req.params.status });
		}
	});
});

router.post('/theatre/approve/:id', function (req, res, next) {
	masterHelpers.doApproveTheatre(req.params.id, req.body.status_update_remarks).then((response) => {
		if (response.status){
			req.session.successMsg = 'Theatre approved'
			res.redirect('/admin/theatre/profile/' + req.params.id)
		}else{
			req.session.errorMsg = response.errorMsg
			res.redirect('/admin/theatre/pending')
		}
	})
});

router.post('/theatre/reject/:id', function (req, res, next) {
	masterHelpers.doRejectTheatre(req.params.id, req.body.status_update_remarks).then((response) => {
		if (response.status){
			req.session.successMsg = 'Theatre rejected'
			res.redirect('/admin/theatre/profile/' + req.params.id)
		}else{
			req.session.errorMsg = response.errorMsg
			res.redirect('/admin/theatre/pending')
		}
	})
});

router.post('/seat_layout/:movieId/:mappingId', function (req, res, next) {
	adminHelpers.getSeatInfoLayout(req.params.movieId, req.params.mappingId).then((response) => {
		if (response.status) {
			let bookings = response.bookings;
			let screenDetail = response.mapping.screenDetail;

			let screenLayout = {
				recliner: [],
				prime: [],
				classic_plus: [],
				classic: []
			};

			let recliner_temp = screenDetail.recliner;
			let prime_temp = screenDetail.prime;
			let classic_plus_temp = screenDetail.classic_plus;
			let classic_temp = screenDetail.classic;
			let currentRowNo = 1;
			let currentRow = alphabet_arr[currentRowNo];
			let bookedCount = 0;
			let availableCount = 0;


			if (recliner_temp) {
				for (let i = 1; i <= recliner_temp; i++) {
					const currentCols = [];
					let colDisplay = 1;
					for (let j = 1; j <= screenDetail.columns; j++) {
						if (screenDetail.deleted.indexOf(currentRow + '' + j) != -1) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'notavailable'
							})
						} else if (bookings.indexOf(currentRow + '' + j) != -1) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'booked'
							})
							colDisplay++;
							bookedCount++;
						} else {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'available'
							})
							colDisplay++;
							availableCount++;
						}
					}
					currentRowNo++;
					currentRow = alphabet_arr[currentRowNo]
					screenLayout.recliner.push(currentCols);
				}
			}

			if (prime_temp) {
				for (let i = 1; i <= prime_temp; i++) {
					const currentCols = [];
					let colDisplay = 1;
					for (let j = 1; j <= screenDetail.columns; j++) {
						if (screenDetail.deleted.indexOf(currentRow + '' + j) != -1) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'notavailable'
							})
						} else if (bookings.indexOf(currentRow + '' + j) != -1) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'booked'
							})
							colDisplay++;
							bookedCount++;
						} else {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'available'
							})
							colDisplay++;
							availableCount++;
						}
					}
					currentRowNo++;
					currentRow = alphabet_arr[currentRowNo]
					screenLayout.prime.push(currentCols);
				}
			}

			if (classic_plus_temp) {
				for (let i = 1; i <= classic_plus_temp; i++) {
					const currentCols = [];
					let colDisplay = 1;
					for (let j = 1; j <= screenDetail.columns; j++) {
						if (screenDetail.deleted.indexOf(currentRow + '' + j) != -1) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'notavailable'
							})
						} else if (bookings.indexOf(currentRow + '' + j) != -1) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'booked'
							})
							colDisplay++;
							bookedCount++;
						} else {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'available'
							})
							colDisplay++;
							availableCount++;
						}
					}
					currentRowNo++;
					currentRow = alphabet_arr[currentRowNo]
					screenLayout.classic_plus.push(currentCols);
				}
			}

			if (classic_temp) {
				for (let i = 1; i <= classic_temp; i++) {
					const currentCols = [];
					let colDisplay = 1;
					for (let j = 1; j <= screenDetail.columns; j++) {
						if (screenDetail.deleted.indexOf(currentRow + '' + j) != -1) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'notavailable'
							})
						} else if (bookings.indexOf(currentRow + '' + j) != -1) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'booked'
							})
							colDisplay++;
							bookedCount++;
						} else {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'available'
							})
							colDisplay++;
							availableCount++;
						}
					}
					currentRowNo++;
					currentRow = alphabet_arr[currentRowNo]
					screenLayout.classic.push(currentCols);
				}
			}

			hb.render('views/admin/theatre/seat_layout.hbs', { 
				movie: response.movie,
				mapping: response.mapping,
				screenLayout,
				screenDetail,
				movieId: req.params.movieId,
				mappingId: req.params.mappingId,
				bookedCount,
				availableCount
			 }).then((renderedHtml) => {
				res.send({ status: true, view: renderedHtml })
			});

		} else {
			res.send({status : false})
		}
	})
})



router.get('/logout', function (req, res, next) {
	req.session.destroy()
    res.redirect('/admin/login')
});

module.exports = router;
