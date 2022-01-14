var express = require('express');
const userHelpers = require('../helpers/user-helpers');
const masterHelpers = require('../helpers/master-helpers')
var router = express.Router();
require('dotenv').config();

const movieDbApi = process.env.MOVIEDB_API;
const mdb = require('moviedb')(movieDbApi);

const MovieDb = require('moviedb-promise')
const moviedb = new MovieDb(movieDbApi)

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceID = process.env.SERVICE_ID;

const client = require("twilio")(accountSid, authToken);

const userTitle = "MovieBuff"
const isUser = true

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

router.get('/', function (req, res, next) {
	var errorMsg = req.session.errorMsg;
	req.session.errorMsg = null
	var successMsg = req.session.successMsg
	req.session.successMsg = null

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
	const currentDate = year + '-' + month + '-' + day;

	masterHelpers.getTheatresWithMovies().then((response) => {
		masterHelpers.getMoviesWithTheatres(parseInt(year + '' + month + '' + day) ).then((movies) => {
			masterHelpers.getUpcomingMovies(parseInt(year + '' + month + '' + day) ).then((upcoming) => {
				res.render('user/index', {
					title: userTitle, section: "home", successMsg, errorMsg, isUser,
					user_name: req.session.user_name, isUserLoggedIn: req.session.isUserLoggedIn,
					theatres: response.theatres,
					currentDate: currentDate,
					movies,
					upcoming
				});
			})
		})
	})

});

router.get('/signup', function (req, res, next) {
	if (req.session.isUserLoggedIn) {
		res.redirect('/')
	} else {
		var errorMsg = req.session.errorMsg;
		req.session.errorMsg = null
		var successMsg = req.session.successMsg
		req.session.successMsg = null
		res.render('user/signup', { title: userTitle, isUser, errorMsg, successMsg, section: 'account' });
	}
});

router.post('/resend_otp', function (req, res, next) {
	try {
		client.verify
			.services(serviceID)
			.verifications.create({ to: req.session.user_mobile, channel: "sms" })
			.then((verification) => {
				if (verification.status === "pending") {
					res.send({ status: true });
				} else {
					res.send({ status: false, errorMsg: "OTP sending failed. Please try again" });
				}
			});
	} catch (error) {
		res.send({ status: false, errorMsg: "OTP sending failed. Please try again" });
	}
});

router.post('/getotp', function (req, res, next) {
	const toPhoneNumber = '+91' + req.body.mobile;

	const userData = {
		email: req.body.email,
		mobile: toPhoneNumber
	}

	userHelpers.doUserCheck(userData).then((response) => {
		if (!response.status) {
			req.session.errorMsg = response.errorMsg
			res.redirect('/signup')
		} else {
			req.session.user_name = req.body.name;
			req.session.user_email = req.body.email;
			req.session.user_mobile = toPhoneNumber;
			req.session.user_password = req.body.password;

			try {
				client.verify
					.services(serviceID)
					.verifications.create({ to: toPhoneNumber, channel: "sms" })
					.then((verification) => {
						if (verification.status === "pending") {
							res.render('user/otpverify', { title: userTitle, isUser })
						} else {
							req.session.errorMsg = "OTP sending failed. Please try again";
							res.redirect('/signup');
						}
					});
			} catch (error) {
				req.session.errorMsg = "OTP sending failed. Please try again";
				res.redirect('/signup');
			}
		}
	})
});

router.post('/verifyotp', function (req, res, next) {
	const verificationCode = req.body.verificationCode;
	const toPhoneNumber = req.session.user_mobile
	try {
		client.verify
			.services(serviceID)
			.verificationChecks.create({ to: toPhoneNumber, code: verificationCode })
			.then((verification_check) => {
				if (verification_check.status === "approved") {

					const userData = {
						name: req.session.user_name,
						email: req.session.user_email,
						mobile: req.session.user_mobile,
						password: req.session.user_password
					}

					userHelpers.doUserSignUp(userData).then((response) => {
						if (response.status) {
							req.session.user_password = null
							req.session.isUserLoggedIn = true;
							req.session.userId = response.userId
							req.session.successMsg = "Sign Up Successful. Welcome to MovieBuff"
							res.redirect('/')
						} else {
							req.session.errorMsg = response.errorMsg
							res.redirect('/signup')
						}
					});
				} else {
					req.session.errorMsg = "OTP verification failed. Please try again";
					res.redirect('/signup')
				}
			});
	} catch (error) {
		req.session.errorMsg = "OTP verification failed. Please try again";
		res.redirect('/signup')
	}
});

router.post('/loginverifyotp', function (req, res, next) {
	const verificationCode = req.body.verificationCode;
	const toPhoneNumber = req.session.user_mobile
	try {
		client.verify
			.services(serviceID)
			.verificationChecks.create({ to: toPhoneNumber, code: verificationCode })
			.then((verification_check) => {
				if (verification_check.status === "approved") {

					userHelpers.doUserLoginByMobile(toPhoneNumber).then((response) => {
						if (response.status) {
							req.session.isUserLoggedIn = true;
							req.session.userId = response.user._id
							req.session.user_name = response.user.name;
							req.session.successMsg = "Log In Successful. Welcome to MovieBuff"
							res.redirect('/')
						} else {
							req.session.errorMsg = response.errorMsg
							res.redirect('/otplogin')
						}
					});
				} else {
					req.session.errorMsg = "OTP verification failed. Please try again";
					res.redirect('/otplogin')
				}
			});
	} catch (error) {
		req.session.errorMsg = "OTP verification failed. Please try again";
		res.redirect('/otplogin')
	}
});

router.get('/login', (req, res, next) => {
	if (req.session.isUserLoggedIn) {
		res.redirect('/')
	} else {
		const successMsg = req.session.successMsg
		req.session.successMsg = null;
		const errorMsg = req.session.errorMsg
		req.session.errorMsg = null;
		res.render('user/login', { title: userTitle, isUser, successMsg, errorMsg, section: 'account' })
	}
})

router.get('/otplogin', (req, res, next) => {
	if (req.session.isUserLoggedIn) {
		res.redirect('/')
	} else {
		const successMsg = req.session.successMsg
		req.session.successMsg = null;
		const errorMsg = req.session.errorMsg
		req.session.errorMsg = null;
		res.render('user/otplogin', { title: userTitle, isUser, successMsg, errorMsg, section: 'account' })
	}
})

router.post('/otplogin', (req, res, next) => {
	const toPhoneNumber = '+91' + req.body.mobile;

	userHelpers.doUserCheckByMobile(toPhoneNumber).then((response) => {
		if (!response.status) {
			req.session.errorMsg = response.errorMsg
			res.redirect('/otplogin')
		} else {
			req.session.user_mobile = toPhoneNumber;

			try {
				client.verify
					.services(serviceID)
					.verifications.create({ to: toPhoneNumber, channel: "sms" })
					.then((verification) => {
						if (verification.status === "pending") {
							res.render('user/otpverify', { title: userTitle, isUser, isLoginOtp: true })
						} else {
							req.session.errorMsg = "OTP sending failed. Please try again";
							res.redirect('/otplogin');
						}
					});
			} catch (error) {
				req.session.errorMsg = "OTP sending failed. Please try again";
				res.redirect('/otplogin');
			}
		}
	})
})

router.post('/login', (req, res, next) => {
	userHelpers.doUserLogin(req.body).then((response) => {
		if (response.status) {
			req.session.userId = response.user._id
			req.session.isUserLoggedIn = true;
			req.session.user_name = response.user.name;
			req.session.successMsg = "Log In Successful. Welcome to MovieBuff"
			res.redirect('/')
		} else {
			req.session.errorMsg = response.errorMsg
			res.redirect('/login')
		}
	})
})

router.get('/logout', function (req, res, next) {
	req.session.destroy()
	res.redirect('/')
});

router.get('/theatre/:id/:date', function (req, res, next) {

	const currentDay = new Date();

	let currentMonth = currentDay.getMonth();
	currentMonth = parseInt(currentMonth) + 1;

	if (currentMonth < 10) {
		currentMonth = '0' + currentMonth
	}

	let currentYear = currentDay.getFullYear();
	let currentNewDay = currentDay.getDate();

	if (currentNewDay < 10) {
		currentNewDay = '0' + currentNewDay
	}

	let currentDayJoined = currentYear + '-' + currentMonth + '-' + currentNewDay;

	var date = null;
	var datesArr = [];
	for (var i = 1; i <= 6 ;i++){
		date = new Date();
		date.setDate(date.getDate() + i);

		let dateMonth = date.getMonth();
		dateMonth = parseInt(dateMonth) + 1;

		if (dateMonth < 10) {
			dateMonth = '0' + dateMonth
		}

		let dateYear = date.getFullYear();
		let dateDay = date.getDate();

		if (dateDay < 10) {
			dateDay = '0' + dateDay
		}

		datesArr.push(dateYear + '-' + dateMonth + '-' + dateDay);
	}

	let showDate = req.params.date.split('-')
	let showDateInt = parseInt(showDate[0] + '' + showDate[1] + '' + showDate[2]);
	userHelpers.getTheatreShows(req.params.id, showDateInt).then((response) => {
		if (response.status) {
			res.render('user/theatre_info', {
				title: userTitle,
				section: "home",
				isUser,
				user_name: req.session.user_name,
				isUserLoggedIn: req.session.isUserLoggedIn,
				theatre: response.theatre,
				shows: response.shows,
				date: req.params.date,
				currentDayJoined,
				datesArr
			})
		}else{
			req.session.errorMsg = response.errorMsg;
			res.redirect('/')
		}
	})
});


router.get('/seat_layout/:movieId/:mappingId/:date', async (req, res, next) => {

	let dateObj = new Date();
    let month = parseInt(dateObj.getUTCMonth()) + 1;
    let day = parseInt(dateObj.getUTCDate());
    let year = parseInt(dateObj.getUTCFullYear());

    if (day < 10){
        day = '0' + day;
    }

    if (month < 10){
        month = '0' + month
    }

    let currentHour = dateObj.getHours();
    let currentMinutes = dateObj.getMinutes();

    if (currentHour < 10){
        currentHour = '0' + currentHour
    }

    if (currentMinutes < 10){
        currentHour = '0' + currentHour
    }

	const currentTime = parseInt(year + '' + month + '' + day + '' + currentHour + '' + currentMinutes + '' + '00');

    const endTime = currentTime + 180;

    await userHelpers.deleteExistingDisabled(currentTime).then((result) => { });

	await userHelpers.deleteExistingUserMappedDisabled(req.session.userId, req.params.mappingId, req.params.date).then((result) => { });

	userHelpers.getSeatInfoLayout(req.params.movieId, req.params.mappingId, req.params.date).then((response) => {
		if (response.status) {
			let bookings = response.bookings;
			let disabledArr = response.disabledArr;
			let numberOfBookings = bookings.length;
			let screenDetail = response.mapping.screenDetail;
			let totalSeats = parseInt(screenDetail.numberOfSeats);
			let balance = totalSeats - numberOfBookings - disabledArr.length;

			if (req.session.seat_count) {
				if (parseInt(req.session.seat_count) > 0) {
					if (balance < req.session.seat_count) {
						req.session.seat_count = null;
						req.session.errorMsg = 'Not enough seats in given show.'
						res.redirect('/')
					}
				}
			}

			if (balance > 10) {
				balance = 10;
			}

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
						} else if (bookings.indexOf(currentRow + '' + j) != -1 || disabledArr.indexOf(currentRow + '' + j) != -1 ) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'booked'
							})
							colDisplay++;
						} else {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'available'
							})
							colDisplay++;
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
						} else if (bookings.indexOf(currentRow + '' + j) != -1 || disabledArr.indexOf(currentRow + '' + j) != -1 ) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'booked'
							})
							colDisplay++;
						} else {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'available'
							})
							colDisplay++;
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
						} else if (bookings.indexOf(currentRow + '' + j) != -1 || disabledArr.indexOf(currentRow + '' + j) != -1 ) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'booked'
							})
							colDisplay++;
						} else {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'available'
							})
							colDisplay++;
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
						} else if (bookings.indexOf(currentRow + '' + j) != -1 || disabledArr.indexOf(currentRow + '' + j) != -1 ) {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'booked'
							})
							colDisplay++;
						} else {
							currentCols.push({
								seatDisplay: currentRow + '' + colDisplay,
								actualSeat: currentRow + '' + j,
								status: 'available'
							})
							colDisplay++;
						}
					}
					currentRowNo++;
					currentRow = alphabet_arr[currentRowNo]
					screenLayout.classic.push(currentCols);
				}
			}

			res.render('user/seat_layout', {
				title: userTitle,
				section: "home",
				isUser,
				user_name: req.session.user_name,
				isUserLoggedIn: req.session.isUserLoggedIn,
				date: req.params.date,
				movie: response.movie,
				mapping: response.mapping,
				screenLayout,
				screenDetail,
				seat_count: req.session.seat_count,
				balance: balance,
				movieId: req.params.movieId,
				mappingId: req.params.mappingId,
				date: req.params.date
			})
		} else {
			req.session.errorMsg = response.errorMsg;
			res.redirect('/')
		}
	})
})

router.get('/movie_info/:id/:api_id', async (req, res, next) => {
	const currentDay = new Date();

	let currentMonth = currentDay.getMonth();
	currentMonth = parseInt(currentMonth) + 1;

	if (currentMonth < 9) {
		currentMonth = '0' + currentMonth
	}

	let currentYear = currentDay.getFullYear();
	let currentNewDay = currentDay.getDate();

	if (currentNewDay < 9) {
		currentNewDay = '0' + currentNewDay
	}

	let currentDayJoined = currentYear + '-' + currentMonth + '-' + currentNewDay;
	let languageName = '';

	await userHelpers.getMovieInfo(req.params.id).then(async (response) => {
		if (response.movie.images){
			backdrops = response.movie.images.backdrops.sort((a, b) => a.width - b.width)
		}else{
			backdrops = await masterHelpers.getMovieUploadedImage(req.params.id);
		}

		if (response.movie.api_movie_id == '0'){
			response.movie.backdrop = await masterHelpers.getMovieUploadedBackdrop(req.params.id);
			languageName = response.movie.original_language;
		}else{
			languageName = await masterHelpers.getLanguageNameByCode(response.movie.original_language);
		}

		let rateEligible = true

		if (!req.session.userId){
			rateEligible = false;
		}

		if (rateEligible){
			let existReview = await userHelpers.getUserMovieReview(req.session.userId, req.params.id);
			if (existReview.status){
				rateEligible = false;
			}
			if (rateEligible){
				let existBooking = await userHelpers.getUserMovieBooking(req.session.userId, req.params.id);
				if (!existBooking.status){
					rateEligible = false;
				}
			}
		}


		await masterHelpers.getMovieReviews(req.params.id).then((reviews) => {
			res.render('user/movie_info', {
				title: userTitle,
				section: "home",
				isUser,
				user_name: req.session.user_name,
				isUserLoggedIn: req.session.isUserLoggedIn,
				movie: response.movie,
				movieImages: backdrops,
				credits: response.movie.credits ? response.movie.credits.cast : null,
				crews: response.movie.credits ? response.movie.credits.crew : null,
				reviews,
				reviewCount : reviews.length,
				date : currentDayJoined,
				languageName,
				rateEligible
			})
		})

	})
})


router.get('/upcoming/movie_info/:id/:api_id', async (req, res, next) => {
	let languageName = '';

	await userHelpers.getMovieInfo(req.params.id).then(async (response) => {
		if (response.movie.images){
			backdrops = response.movie.images.backdrops.sort((a, b) => a.width - b.width)
		}else{
			backdrops = await masterHelpers.getMovieUploadedImage(req.params.id);
		}

		if (response.movie.api_movie_id == '0'){
			response.movie.backdrop = await masterHelpers.getMovieUploadedBackdrop(req.params.id);
			languageName = response.movie.original_language;
		}else{
			languageName = await masterHelpers.getLanguageNameByCode(response.movie.original_language);
		}

		res.render('user/movie_info', {
			title: userTitle,
			section: "home",
			isUser,
			user_name: req.session.user_name,
			isUserLoggedIn: req.session.isUserLoggedIn,
			movie: response.movie,
			movieImages: backdrops,
			credits: response.movie.credits ? response.movie.credits.cast : null,
			crews: response.movie.credits ? response.movie.credits.crew : null,
			reviews: response.movie.reviews,
			languageName,
			upcoming : true
		})
	})
})

router.get('/movie_show_time/:id/:date', async (req, res, next) => {
	let lat2 = req.session.lat;
	let lng2 = req.session.long;

	const currentDay = new Date();

	let currentMonth = currentDay.getMonth();
	currentMonth = parseInt(currentMonth) + 1;

	if (currentMonth < 9) {
		currentMonth = '0' + currentMonth
	}

	let currentYear = currentDay.getFullYear();
	let currentNewDay = currentDay.getDate();

	if (currentNewDay < 9) {
		currentNewDay = '0' + currentNewDay
	}

	let currentDayJoined = currentYear + '-' + currentMonth + '-' + currentNewDay;
	let currentDayInt = parseInt(currentYear + '' + currentMonth + '' + currentNewDay);

	var date = null;
	var datesArr = [];
	for (var i = 1; i <= 6 ;i++){
		date = new Date();
		date.setDate(date.getDate() + i);

		let dateMonth = date.getMonth();
		dateMonth = parseInt(dateMonth) + 1;

		if (dateMonth < 10) {
			dateMonth = '0' + dateMonth
		}

		let dateYear = date.getFullYear();
		let dateDay = date.getDate();

		if (dateDay < 10) {
			dateDay = '0' + dateDay
		}

		datesArr.push(dateYear + '-' + dateMonth + '-' + dateDay);
	}

	let showDate = req.params.date.split('-')
	let showDateInt = parseInt(showDate[0] + '' + showDate[1] + '' + showDate[2]);

	if (currentDayInt > showDateInt){
		req.session.errorMsg = "Date Error : Bad Request"
		res.redirect('/')
	}else{
		userHelpers.getMovieShows(req.params.id, showDateInt, currentDayInt).then(async (response) => {

			let languageName = '';
			if (response.movie.api_movie_id == '0'){
				languageName = response.movie.original_language;
			}else{
				languageName = await masterHelpers.getLanguageNameByCode(response.movie.original_language);
			}

			let backdrops = [];
			if (response.movie.images){
				backdrops = response.movie.images.backdrops.sort((a, b) => a.width - b.width)
			}else{
				backdrops = await masterHelpers.getMovieUploadedImage(response.movie._id);
			}

			let theatreMappings = response.theatreMappings;

			for (let i = 0; i < theatreMappings.length; i++){
				let lat1 = parseFloat(theatreMappings[i].theatreDetails.lat)
				let lng1 = parseFloat(theatreMappings[i].theatreDetails.lng)
				theatreMappings[i].theatreDetails.distance = getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2)
			}

			theatreMappings = theatreMappings.sort((a, b) => a.theatreDetails.distance - b.theatreDetails.distance)

			if (response.status) {
				res.render('user/movie_show_time', {
					title: userTitle,
					section: "home",
					isUser,
					user_name: req.session.user_name,
					isUserLoggedIn: req.session.isUserLoggedIn,
					movie: response.movie,
					theatreMappings,
					date: req.params.date,
					currentDayJoined,
					datesArr,
					languageName,
					movieImages: backdrops
				})
			}else{
				req.session.errorMsg = response.errorMsg;
				res.redirect('/')
			}
		})

	}
})

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2 - lat1);  // deg2rad below
	var dLon = deg2rad(lon2 - lon1);
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2)
		;
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c; // Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI / 180)
}

router.post('/set_location/:lat/:long', (req, res, next) => {
	req.session.lat = req.params.lat;
	req.session.long = req.params.long;
	console.log('session', req.session.lat, req.session.long)
	res.send(true)
})

router.get('/get_ticket_details/:id', (req, res, next) => {
	let dateObj = new Date();
    let month = dateObj.getUTCMonth() + 1;
    let day = dateObj.getUTCDate();
    let year = dateObj.getUTCFullYear();
    const currentDate = parseInt(year + '' + month + '' + day);

	userHelpers.getTicketDetails(req.params.id).then((booking) => {
		res.render('user/ticket_details', {
			title: userTitle,
			section: "home",
			isUser,
			user_name: req.session.user_name,
			isUserLoggedIn: req.session.isUserLoggedIn,
			booking : booking.bookingData,
			currentDate
		})
	})
})

module.exports = router;