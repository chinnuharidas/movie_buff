var express = require('express');
var router = express.Router();
const masterHelpers = require('../helpers/master-helpers');
const ownerHelpers = require('../helpers/owner-helpers');

const { storage } = require('../config/connection')
var db = require('../config/connection')
const multer = require('multer');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceID = process.env.SERVICE_ID;

const client = require("twilio")(accountSid, authToken);

const isOwner = true;
const ownerTitle = 'Theatre Owner'
let active = 'dashboard'
let section = ''

let upload = null;

storage.on('connection', (db) => {
	upload = multer({
		storage: storage
	}).single('theatre_image');
});

router.get('/login', (req, res, next) => {
    if (req.session.isOwnerLoggedIn){
        res.redirect('/owner')
    }else{
        const successMsg = req.session.successMsg
        req.session.successMsg = null;
        const errorMsg = req.session.errorMsg
        req.session.errorMsg = null;
        res.render('owner/login', {title : ownerTitle + ' - Login', isOwnerLogin : true, successMsg, errorMsg} )
    }
})

router.post('/login', (req, res, next) => {
    ownerHelpers.doOwnerLogin(req.body).then((response) => {
		if (response.status) {
			req.session.owneruser = response.owneruser
			req.session.isOwnerLoggedIn = true
            req.session.profilePicUrl = response.profilePicUrl
			res.redirect('/owner')
		} else {
			req.session.errorMsg = response.errorMsg
			res.redirect('/owner/login')
		}
	})
})

router.get('/signup', (req, res, next) => {
    if (req.session.isOwnerLoggedIn){
        res.redirect('/owner')
    }else{
        const errorMsg = req.session.errorMsg;
        req.session.errorMsg = null;
        masterHelpers.getDistricts().then((districts) => {
            res.render('owner/signup', {title : ownerTitle + ' - Sign Up', isOwnerLogin : true, districts, errorMsg} )
        })
    }
})

router.post('/signup', (req, res, next) => {
    ownerHelpers.doOwnerSignUp(req.body).then((response) => {
        if (response.status){
            req.session.successMsg = "Account Created. Login In."
            res.redirect('/owner/login');
        }else{
            req.session.errorMsg = response.errorMsg
            res.redirect('/owner/signup')
        }
    });
})

router.post('/getotp', function (req, res, next) {
	const toPhoneNumber = '+91' + req.body.owner_mobile;

	const userData = {
		email: req.body.owner_email,
		mobile: toPhoneNumber
	}

	ownerHelpers.doOwnerCheck(userData).then((response) => {
		if (!response.status) {
			req.session.errorMsg = response.errorMsg
			res.redirect('/owner/signup')
		} else {
			req.session.owner_otp_user = req.body;
			req.session.owner_mobile = toPhoneNumber;

			try {
				client.verify
					.services(serviceID)
					.verifications.create({ to: toPhoneNumber, channel: "sms" })
					.then((verification) => {
						if (verification.status === "pending") {
							res.render('owner/otpverify', { title : ownerTitle + ' - Sign Up', isOwnerLogin : true })
						} else {
							req.session.errorMsg = "OTP sending failed. Please try again";
							res.redirect('/owner/signup');
						}
					});
			} catch (error) {
				req.session.errorMsg = "OTP sending failed. Please try again";
				res.redirect('/owner/signup');
			}
		}
	});
})

router.post('/verifyotp', function (req, res, next) {
	const verificationCode = req.body.verificationCode;
	const toPhoneNumber = req.session.owner_mobile
	try {
		client.verify
			.services(serviceID)
			.verificationChecks.create({ to: toPhoneNumber, code: verificationCode })
			.then((verification_check) => {
				if (verification_check.status === "approved") {
					ownerHelpers.doOwnerSignUp(req.session.owner_otp_user).then((response) => {
						if (response.status){
							req.session.successMsg = "Account Created. Login In."
							res.redirect('/owner/login');
						}else{
							req.session.errorMsg = response.errorMsg
							res.redirect('/owner/signup')
						}
					});

				} else {
					req.session.errorMsg = "OTP verification failed. Please try again";
					res.redirect('/owner/signup')
				}
			});
	} catch (error) {
		req.session.errorMsg = "OTP verification failed. Please try again";
		res.redirect('/owner/signup')
	}
});

router.post('/resend_otp', function (req, res, next) {
	try {
		client.verify
			.services(serviceID)
			.verifications.create({ to: req.session.owner_mobile, channel: "sms" })
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


router.get('/otplogin', (req, res, next) => {
	if (req.session.isOwnerLoggedIn){
        res.redirect('/owner')
    }else{
		const successMsg = req.session.successMsg
		req.session.successMsg = null;
		const errorMsg = req.session.errorMsg
		req.session.errorMsg = null;
		res.render('owner/otplogin', { title : ownerTitle + ' - Log In', isOwnerLogin : true , successMsg, errorMsg })
	}
})

router.post('/otplogin', (req, res, next) => {
	const toPhoneNumber = '+91' + req.body.mobile;
	req.session.owner_mobile_login = req.body.mobile;

	ownerHelpers.doOwnerCheckByMobile(req.body.mobile).then((response) => {
		if (!response.status) {
			req.session.errorMsg = response.errorMsg
			res.redirect('/owner/otplogin')
		} else {
			req.session.owner_mobile = toPhoneNumber;

			try {
				client.verify
					.services(serviceID)
					.verifications.create({ to: toPhoneNumber, channel: "sms" })
					.then((verification) => {
						if (verification.status === "pending") {
							res.render('owner/otpverify', { title : ownerTitle + ' - Log In', isOwnerLogin : true , isLoginOtp: true })
						} else {
							req.session.errorMsg = "OTP sending failed. Please try again";
							res.redirect('/owner/otplogin');
						}
					});
			} catch (error) {
				req.session.errorMsg = "OTP sending failed. Please try again";
				res.redirect('/owner/otplogin');
			}
		}
	})
})

router.post('/loginverifyotp', function (req, res, next) {
	const verificationCode = req.body.verificationCode;
	const toPhoneNumber = req.session.owner_mobile
	try {
		client.verify
			.services(serviceID)
			.verificationChecks.create({ to: toPhoneNumber, code: verificationCode })
			.then((verification_check) => {
				if (verification_check.status === "approved") {

					ownerHelpers.doOwnerCheckByMobile(req.session.owner_mobile_login).then((response) => {
						if (response.status) {
							req.session.owneruser = response.owneruser
							req.session.isOwnerLoggedIn = true
							req.session.profilePicUrl = response.profilePicUrl
							res.redirect('/owner')
						} else {
							req.session.errorMsg = response.errorMsg
							res.redirect('/owner/otplogin')
						}
					});
				} else {
					req.session.errorMsg = "OTP verification failed. Please try again";
					res.redirect('/owner/otplogin')
				}
			});
	} catch (error) {
		req.session.errorMsg = "OTP verification failed. Please try again";
		res.redirect('/owner/otplogin')
	}
});

router.use((req, res, next) => {
    if (req.session.isOwnerLoggedIn){
        next()
    }else{
        res.redirect('/owner/login')
    }
})

router.get('/', function (req, res, next) {
	active = 'dashboard'
	section = 'dashboard'
	const date = new Date();
	const currentMonth = date.getMonth() + 1;
	const currentYear = date.getFullYear();
	res.render('owner/dashboard', { 
		dashboard : true,
		active, isOwner, 
		currentMonth,
		currentYear,
		profilePicUrl : req.session.profilePicUrl, title : ownerTitle + ' - Dashboard' 
	});
});

router.get('/profile', function (req, res, next) {
	active = 'profile'
	section = 'profile'

    const errorMsg = req.session.errorMsg;
	req.session.errorMsg = null
	const successMsg = req.session.successMsg;
	req.session.successMsg = null

    masterHelpers.getTheatreById(req.session.owneruser._id).then((response) => {
		if (response.status){
			const theatre = response.result; 
			res.render('owner/profile', { errorMsg, successMsg, theatre, section, active, isOwner, profilePicUrl : req.session.profilePicUrl, title : ownerTitle + ' - Theatres Profile' })
		}
	})
});

router.post('/theatre/imgform/:id', function (req, res, next) {
	masterHelpers.getTheatreById(req.params.id).then((response) => {
		if (response.status){
			const theatre = response.result; 
			res.render('admin/theatre/imgform', {layout : false, theatre, isOwner });
		}
	});
});

router.post('/theatre/imgupload/:id', function (req, res, next) {
	const theatre_id = req.params.id;
	let status = true;
	let file_id = null;
	upload(req, res, (err) => {
		if (err) {
			status = false;
			req.session.errorMsg = "Image uploading error"
		}else{
			file_id = res.req.file.id
			masterHelpers.doTheatreImageUpload(theatre_id, file_id).then((response) => {
				if (response.status){
					req.session.successMsg = "Image uploading success"
				}else{
					req.session.errorMsg = "Image uploading error"
				}
			})
		}
	});

	res.redirect('/owner/profile')
});

router.post('/theatre/profilepicform/:id', function (req, res, next) {
	masterHelpers.getTheatreById(req.params.id).then((response) => {
		if (response.status){
			const theatre = response.result; 
			res.render('admin/theatre/profilepicform', {layout : false, theatre, isOwner });
		}
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
		res.redirect('/owner/profile')
	});
});

router.get('/screen', function (req, res, next) {
	const errorMsg = req.session.errorMsg;
	req.session.errorMsg = null
	const successMsg = req.session.successMsg;
	req.session.successMsg = null
	active = 'screen'
	section = 'screen'
	masterHelpers.getScreensByTheatre(req.session.owneruser._id).then((theatres) => {
		res.render('owner/screen/list', { errorMsg, successMsg, theatres, section, active, isOwner, title : ownerTitle + ' - Screen List' })
	})
});

router.get('/screen/add', function (req, res, next) {
	active = 'screen'
	section = 'screen'
	res.render('owner/screen/add', { section, active, isOwner, title : ownerTitle + ' - Screen Add' })
});

router.post('/screen/add', function (req, res, next) {
	ownerHelpers.addScreenToTheatre(req.session.owneruser._id, req.body).then((response) => {
		if (!response.status){
			req.session.errorMsg = response.errorMsg;
		}
		res.redirect('/owner/screen')
	})
});

router.get('/screen/edit/:id', function (req, res, next) {
	active = 'screen'
	section = 'screen'
	ownerHelpers.getScreenById(req.params.id).then((response) => {
		res.render('owner/screen/edit', { screen : response.screen, section, active, isOwner, title : ownerTitle + ' - Screen Edit' })
	})
});

router.post('/screen/edit/:id', function (req, res, next) {
	ownerHelpers.updateScreen(req.params.id, req.body).then((response) => {
		res.redirect('/owner/screen')
	})
});

router.post('/screen/disable/:id', function (req, res, next) {
	ownerHelpers.disableScreen(req.params.id).then((response) => {
		res.send(true);
	})
});

router.post('/screen/enable/:id', function (req, res, next) {
	ownerHelpers.enableScreen(req.params.id).then((response) => {
		res.send(true);
	})
});

router.get('/logout', function (req, res, next) {
	req.session.destroy()
    res.redirect('/owner/login')
});

module.exports = router;