const { ObjectId } = require('bson');
var express = require('express');
const masterHelpers = require('../helpers/master-helpers');
var router = express.Router();
const ownerHelpers = require('../helpers/owner-helpers');
require('dotenv').config();

const isOwner = true;
const ownerTitle = 'Theatre Owner'
let active = 'dashboard'
let section = ''

// router.use((req, res, next) => {
//     if (req.session.isOwnerLoggedIn){
//         next()
//     }else{
//         res.redirect('/owner/login')
//     }
// })

router.get('/', function (req, res, next) {
	const errorMsg = req.session.errorMsg;
	req.session.errorMsg = null
	const successMsg = req.session.successMsg;
	req.session.successMsg = null
	active = 'movie-map'
	section = 'movie-map'
	ownerHelpers.getMappingsByTheatre(req.session.owneruser._id).then((movieMapping) => {
		res.render('owner/map/list', { errorMsg, successMsg, movieMapping, section, active, isOwner, title: ownerTitle + ' - Mapping' })
	})
});

router.post('/check', function (req, res, next) {

    var formData = req.body;
    formData.theatre = formData.owner_id

    start_arr = formData.start_date.split('/');
    end_arr = formData.end_date.split('/');
    
    start_time_arr = formData.start_time.split(':');
    end_time_arr = formData.end_time.split(':');

    formData.start_date_int = parseInt( start_arr[2] + '' + start_arr[1] + '' + start_arr[0] );
    formData.end_date_int = parseInt( end_arr[2] + '' + end_arr[1] + '' + end_arr[0] );

    formData.start_time_int = parseInt( start_time_arr[0] + '' + start_time_arr[1] + '' + start_time_arr[2] );
    formData.end_time_int = parseInt( end_time_arr[0] + '' + end_time_arr[1] + '' + end_time_arr[2] );

    if (formData.screen && formData.theatre){
        ownerHelpers.screenTimeMappingCheck(formData).then((response) => {
            res.send(response);
        })  
    }else{
        res.send(false);
    }

});

router.get('/add', function (req, res, next) {
	active = 'movie-map'
	section = 'movie-map'
    ownerHelpers.getEnabledMoviesByTheatre(req.session.owneruser._id).then((movies) => {
        masterHelpers.getEnabledScreensByTheatre(req.session.owneruser._id).then((screens) => {
            res.render('owner/map/add', { owner_id : req.session.owneruser._id, section, active, movies, screens, isOwner, title: ownerTitle + ' - Mapping Add' })
        })
    })
});

router.post('/add', function (req, res, next) {

    let formData = req.body;

    let start_date = formData.start_date;
    let end_date = formData.end_date;
    start_arr = start_date.split('/');
    end_arr = end_date.split('/');

    formData.start_date_int = parseInt( start_arr[2] + '' + start_arr[1] + '' + start_arr[0] );
    formData.end_date_int = parseInt( end_arr[2] + '' + end_arr[1] + '' + end_arr[0] );

    let start_time = formData.start_time;
    let end_time = formData.end_time;
    start_time_arr = start_time.split(':');
    end_time_arr = end_time.split(':');

    formData.start_time_int = parseInt( start_time_arr[0] + '' + start_time_arr[1] + '' + start_time_arr[2] );
    formData.end_time_int = parseInt( end_time_arr[0] + '' + end_time_arr[1] + '' + end_time_arr[2] );
    
    if (formData.start_date_int > formData.end_date_int){
        req.session.errorMsg = 'End date should be greater than start date';
        res.redirect('/owner/map')
    }else if (formData.start_time_int >= formData.end_time_int){
        req.session.errorMsg = 'End time should be greater than start time';
        res.redirect('/owner/map')
    }else{
        checkForm = {};
        checkForm.owner_id = formData.theatre;
        checkForm.screen = formData.screen;
        checkForm.start_time_int = formData.start_time_int
        checkForm.end_time_int = formData.end_time_int
        checkForm.start_date_int = formData.start_date_int
        checkForm.end_date_int = formData.end_date_int

        ownerHelpers.screenTimeMappingCheck(checkForm).then((check) => {
            if (check){
                ownerHelpers.doAddMapping(req.session.owneruser._id, formData).then((response) => {
                    if (response.status){
                        req.session.successMsg = "Movie-Screen-Time added successful"
                    }else{
                        req.session.errorMsg = response.errorMsg;
                    }
                    res.redirect('/owner/map')
                })
            }else{
                req.session.errorMsg = "Screen not availble at given time slot.";
                res.redirect('/owner/map')
            }
        })



    }

});

router.post('/disable/:id', function (req, res, next) {
	ownerHelpers.disableMap(req.params.id).then((response) => {
		res.send(true);
	})
});

router.post('/enable/:id', function (req, res, next) {
	ownerHelpers.enableMap(req.params.id).then((response) => {
        if (response.status){
            req.session.successMsg = "Screen mapping enabled";
        }else{
            req.session.errorMsg = response.errorMsg
        }
		res.send(true);
	})
});

router.get('/edit/:id', function (req, res, next) {
	active = 'movie-map'
	section = 'movie-map'
    ownerHelpers.getEnabledMoviesByTheatre(req.session.owneruser._id).then((movies) => {
        masterHelpers.getEnabledScreensByTheatre(req.session.owneruser._id).then((screens) => {
	        ownerHelpers.getMapById(req.params.id).then((mapping) => {
                mapping.movieId = mapping.movie.toString()
                mapping.screenId = mapping.screen.toString()
		        res.render('owner/map/edit', { owner_id : req.session.owneruser._id, mapping, movies, screens, section, active, isOwner, title : ownerTitle + ' - Mapping Edit' })
	        })
        });
    });
});

router.post('/edit/:id', function (req, res, next) {
    let formData = req.body;

    let start_date = formData.start_date;
    let end_date = formData.end_date;
    start_arr = start_date.split('/');
    end_arr = end_date.split('/');

    formData.start_date_int = parseInt( start_arr[2] + '' + start_arr[1] + '' + start_arr[0] );
    formData.end_date_int = parseInt( end_arr[2] + '' + end_arr[1] + '' + end_arr[0] );

    let start_time = formData.start_time;
    let end_time = formData.end_time;
    start_time_arr = start_time.split(':');
    end_time_arr = end_time.split(':');

    formData.start_time_int = parseInt( start_time_arr[0] + '' + start_time_arr[1] + '' + start_time_arr[2] );
    formData.end_time_int = parseInt( end_time_arr[0] + '' + end_time_arr[1] + '' + end_time_arr[2] );
    
    if (formData.start_date_int > formData.end_date_int){
        req.session.errorMsg = 'End date should be greater than start date';
        res.redirect('/owner/map')
    }else if (formData.start_time_int >= formData.end_time_int){
        req.session.errorMsg = 'End time should be greater than start time';
        res.redirect('/owner/map')
    }else{
        checkForm = {};
        checkForm.owner_id = formData.theatre;
        checkForm.screen = formData.screen;
        checkForm.start_time_int = formData.start_time_int
        checkForm.end_time_int = formData.end_time_int
        checkForm.start_date_int = formData.start_date_int
        checkForm.end_date_int = formData.end_date_int
        checkForm.map_id = req.params.id;

        ownerHelpers.screenTimeMappingCheck(checkForm).then((check) => {
            if (check){
                ownerHelpers.doUpdateMapping(req.session.owneruser._id, req.params.id, formData).then((response) => {
                    if (response.status){
                        req.session.successMsg = "Mapping updated"
                    }else{
                        req.session.errorMsg = response.errorMsg
                    }
                    res.redirect('/owner/map')
                })
            }else{
                req.session.errorMsg = "Screen not availble at given time slot.";
                res.redirect('/owner/map')
            }
        });
    }   
});

module.exports = router;