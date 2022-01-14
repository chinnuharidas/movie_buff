var express = require('express');
const masterHelpers = require('../helpers/master-helpers');
var router = express.Router();
const ownerHelpers = require('../helpers/owner-helpers');

const isOwner = true;
const ownerTitle = 'Theatre Owner'
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

router.use((req, res, next) => {
    if (req.session.isOwnerLoggedIn) {
        next()
    } else {
        res.redirect('/owner/login')
    }
})

router.get('/', function (req, res, next) {
    active = 'report'
    section = 'report'
    ownerHelpers.getEnabledMoviesByTheatre(req.session.owneruser._id).then((movies) => {
        masterHelpers.getEnabledScreensByTheatre(req.session.owneruser._id).then((screens) => {
            ownerHelpers.getRevenuesByTheatre(req.session.owneruser._id, null).then((results) => {
                res.render('owner/report/list', { results, screens, movies, section, active, isOwner, title: ownerTitle + ' - Report' })
            })
        })
    })
});

router.post('/get_report', function (req, res, next) {
    ownerHelpers.getRevenuesByTheatre(req.session.owneruser._id, req.body).then((results) => {
        res.send(results)
    })
});

router.get('/upcoming', function (req, res, next) {
    active = 'upcoming'
    section = 'upcoming'

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

    const currentDateInt = parseInt(currentYear + '' + currentMonth + '' + currentNewDay);

    let currentHour = currentDay.getHours();
    let currentMinutes = currentDay.getMinutes();
    if (currentHour < 10) {
        currentHour = '0' + currentHour;
    }
    if (currentMinutes < 10) {
        currentMinutes = '0' + currentMinutes;
    }
    const currentTimeInt = parseInt(currentHour + '' + currentMinutes + '00');

    ownerHelpers.getUpcomingShows(currentDateInt, currentTimeInt, req.session.owneruser._id).then((response) => {
        res.render('owner/report/upcoming', {
            mappings: response,
            section, active, isOwner,
            currentDateInt,
            title: ownerTitle + ' - Upcoming'
        })
    })

});

router.post('/seats/:id/:dateInt', function (req, res, next) {
    ownerHelpers.getUpcomingBookings(req.params.id, req.params.dateInt).then((response) => {

        let screenDetail = response.screen.screenDetail;

        let recliner_temp = screenDetail.recliner;
        let prime_temp = screenDetail.prime;
        let classic_plus_temp = screenDetail.classic_plus;
        let classic_temp = screenDetail.classic;
        let currentRowNo = 1;
        let currentRow = alphabet_arr[currentRowNo];

        // if (recliner_temp) {
        //     for (let i = 1; i <= recliner_temp; i++) {
        //         const currentCols = [];
        //         let colDisplay = 1;
        //         for (let j = 1; j <= screenDetail.columns; j++) {
        //             if (screenDetail.deleted.indexOf(currentRow + '' + j) != -1) {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'notavailable'
        //                 })
        //             } else if (bookings.indexOf(currentRow + '' + j) != -1) {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'booked'
        //                 })
        //                 colDisplay++;
        //             } else {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'available'
        //                 })
        //                 colDisplay++;
        //             }
        //         }
        //         currentRowNo++;
        //         currentRow = alphabet_arr[currentRowNo]
        //         screenLayout.recliner.push(currentCols);
        //     }
        // }

        // if (prime_temp) {
        //     for (let i = 1; i <= prime_temp; i++) {
        //         const currentCols = [];
        //         let colDisplay = 1;
        //         for (let j = 1; j <= screenDetail.columns; j++) {
        //             if (screenDetail.deleted.indexOf(currentRow + '' + j) != -1) {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'notavailable'
        //                 })
        //             } else if (bookings.indexOf(currentRow + '' + j) != -1) {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'booked'
        //                 })
        //                 colDisplay++;
        //             } else {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'available'
        //                 })
        //                 colDisplay++;
        //             }
        //         }
        //         currentRowNo++;
        //         currentRow = alphabet_arr[currentRowNo]
        //         screenLayout.prime.push(currentCols);
        //     }
        // }

        // if (classic_plus_temp) {
        //     for (let i = 1; i <= classic_plus_temp; i++) {
        //         const currentCols = [];
        //         let colDisplay = 1;
        //         for (let j = 1; j <= screenDetail.columns; j++) {
        //             if (screenDetail.deleted.indexOf(currentRow + '' + j) != -1) {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'notavailable'
        //                 })
        //             } else if (bookings.indexOf(currentRow + '' + j) != -1) {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'booked'
        //                 })
        //                 colDisplay++;
        //             } else {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'available'
        //                 })
        //                 colDisplay++;
        //             }
        //         }
        //         currentRowNo++;
        //         currentRow = alphabet_arr[currentRowNo]
        //         screenLayout.classic_plus.push(currentCols);
        //     }
        // }

        // if (classic_temp) {
        //     for (let i = 1; i <= classic_temp; i++) {
        //         const currentCols = [];
        //         let colDisplay = 1;
        //         for (let j = 1; j <= screenDetail.columns; j++) {
        //             if (screenDetail.deleted.indexOf(currentRow + '' + j) != -1) {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'notavailable'
        //                 })
        //             } else if (bookings.indexOf(currentRow + '' + j) != -1) {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'booked'
        //                 })
        //                 colDisplay++;
        //             } else {
        //                 currentCols.push({
        //                     seatDisplay: currentRow + '' + colDisplay,
        //                     actualSeat: currentRow + '' + j,
        //                     status: 'available'
        //                 })
        //                 colDisplay++;
        //             }
        //         }
        //         currentRowNo++;
        //         currentRow = alphabet_arr[currentRowNo]
        //         screenLayout.classic.push(currentCols);
        //     }
        // }

        res.render('owner/report/seats', { layout: false, response });
    });
});

module.exports = router;