var db = require('../config/connection')
var collection = require('../config/collections')
const { ObjectId } = require('mongodb');
const isodate = require('isodate');
var QRCode = require('qrcode')

require('dotenv').config();
var Razorpay = require('razorpay');
const { REVIEW_COLLECTION } = require('../config/collections');

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

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

var instance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});

module.exports = {
    doUserSignUp: (userData) => {
        userData.createdAt = new Date();
        return new Promise(async (resolve, reject) => {
            var userByEmail = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (userByEmail) {
                return resolve({ status: false, errorMsg: 'Email already assigned to another user' })
            }
            var userByMobile = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: userData.mobile })
            if (userByMobile) {
                return resolve({ status: false, errorMsg: 'Mobile already assigned to another user' })
            }
            userData.isEnabled = true;
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve({ status: true, userId: data.insertedId })
            })
        })
    },
    doUserCheck: (userData) => {
        return new Promise(async (resolve, reject) => {
            if (userData.email) {
                var userByEmail = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
                if (userByEmail) {
                    return resolve({ status: false, errorMsg: 'Email already assigned to another user' })
                }
            }
            var userByMobile = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: userData.mobile })
            if (userByMobile) {
                return resolve({ status: false, errorMsg: 'Mobile already assigned to another user' })
            }
            return resolve({ status: true })
        })
    },
    doUserCheckByMobile: (mobile) => {
        return new Promise(async (resolve, reject) => {
            var userByMobile = await db.get().collection(collection.USER_COLLECTION).findOne(
                { mobile: mobile }
            )
            if (userByMobile) {
                if (userByMobile.isEnabled) {
                    return resolve({ status: true })
                } else {
                    return resolve({ status: false, errorMsg: 'Your account is blocked by admin' })
                }
            } else {
                return resolve({ status: false, errorMsg: "Invalid mobile number" })
            }
        })

    },
    doUserLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.mobile = '+91' + userData.mobile;
            var response = {}
            var user = await db.get().collection(collection.USER_COLLECTION).findOne({ isEnabled: true, mobile: userData.mobile, password: userData.password })
            if (user) {
                response.user = user
                response.status = true
                resolve(response)
            } else {
                var userNotApproved = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: userData.mobile, password: userData.password })
                if (userNotApproved) {
                    resolve({ status: false, errorMsg: "User Login blocked by admin" })
                } else {
                    resolve({ status: false, errorMsg: "Invalid Username or Password" })
                }

            }
        })
    },
    doUserLoginByMobile: (mobile) => {
        return new Promise(async (resolve, reject) => {
            var response = {}
            var user = await db.get().collection(collection.USER_COLLECTION).findOne({ isEnabled: true, mobile: mobile })
            if (user) {
                response.user = user
                response.status = true
                resolve(response)
            } else {
                var userNotApproved = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: mobile })
                if (userNotApproved) {
                    resolve({ status: false, errorMsg: "User Login blocked by admin" })
                } else {
                    resolve({ status: false, errorMsg: "Invalid Username or Password" })
                }

            }
        })
    },
    getTheatreShows: (theatreId, showDate) => {
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
        const currentTime = parseInt(currentHour + '' + currentMinutes + '00');

        return new Promise(async (resolve, reject) => {
            var theatres = await db.get().collection(collection.THEATRE_COLLECTION).aggregate([
                { $match: { _id: ObjectId(theatreId) } },
                {
                    $lookup: {
                        from: collection.DISTRICT_COLLECTION,
                        localField: 'district',
                        foreignField: '_id',
                        as: 'district_arr'
                    }
                }
            ]).toArray()

            if (!theatres || !theatres[0]) {
                return resolve({ status: false, errorMsg: 'Theatre not found' })
            }

            const theatre = theatres[0];
            if (!theatre.isEnabled) {
                return resolve({ status: false, errorMsg: 'Theatre not found' })
            }

            if (currentDateInt == showDate) {
                var shows = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                    {
                        $match: {
                            theatre: ObjectId(theatreId),
                            isEnabled: true,
                            start_date_int: { $lte: showDate },
                            end_date_int: { $gte: showDate },
                            start_time_int: { $gt: currentTime }
                        }
                    },
                    {
                        $lookup: {
                            from: collection.MOVIE_THEATRE_COLLECTION,
                            localField: 'movie',
                            foreignField: '_id',
                            as: 'movie_arr'
                        }
                    },
                    { $unwind: "$movie_arr" },
                    {
                        $group: {
                            _id: "$movie_arr.movie"
                        }
                    },
                    {
                        $lookup: {
                            from: collection.MOVIE_COLLECTION,
                            localField: '_id',
                            foreignField: '_id',
                            as: 'movie_details'
                        }
                    },
                    { $unwind: "$movie_details" },
                    { $sort: { 'movie_details.popularity': 1 } }
                ]).toArray();
            } else if (currentDateInt < showDate) {
                var shows = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                    {
                        $match: {
                            theatre: ObjectId(theatreId),
                            isEnabled: true,
                            start_date_int: { $lte: showDate },
                            end_date_int: { $gte: showDate }
                        }
                    },
                    {
                        $lookup: {
                            from: collection.MOVIE_THEATRE_COLLECTION,
                            localField: 'movie',
                            foreignField: '_id',
                            as: 'movie_arr'
                        }
                    },
                    { $unwind: "$movie_arr" },
                    {
                        $group: {
                            _id: "$movie_arr.movie"
                        }
                    },
                    {
                        $lookup: {
                            from: collection.MOVIE_COLLECTION,
                            localField: '_id',
                            foreignField: '_id',
                            as: 'movie_details'
                        }
                    },
                    { $unwind: "$movie_details" },
                    { $sort: { 'movie_details.popularity': 1 } }
                ]).toArray();
            } else {
                return resolve({ status: false, errorMsg: 'Bad Request. Date Error' })
            }

            for (show of shows) {
                if (currentDateInt == showDate) {
                    show['screens'] = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                        {
                            $match: {
                                theatre: ObjectId(theatreId),
                                isEnabled: true,
                                start_date_int: { $lte: showDate },
                                end_date_int: { $gte: showDate },
                                start_time_int: { $gt: currentTime }
                            }
                        },
                        {
                            $lookup: {
                                from: collection.MOVIE_THEATRE_COLLECTION,
                                localField: 'movie',
                                foreignField: '_id',
                                as: 'movie_arr'
                            }
                        },
                        { $unwind: "$movie_arr" },
                        {
                            $lookup: {
                                from: collection.MOVIE_COLLECTION,
                                localField: 'movie_arr.movie',
                                foreignField: '_id',
                                as: 'movie_details'
                            }
                        },
                        { $unwind: "$movie_details" },
                        {
                            $lookup: {
                                from: collection.SCREEN_COLLECTION,
                                localField: 'screen',
                                foreignField: '_id',
                                as: 'screenDetails'
                            }
                        },
                        {
                            $unwind: '$screenDetails'
                        },
                        {
                            $match: {
                                'movie_details._id': ObjectId(show._id)
                            }
                        },
                        {
                            $project : {
                                '_id' : 1,
                                'movie_details' : 1,
                                'screenDetails' : 1,
                                'start_time' : 1,
                                'start_time_int' : 1
                            }
                        },
                        { $sort: { start_time_int: 1 } }
                    ]).toArray();
                    
                } else {
                    show['screens'] = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                        {
                            $match: {
                                theatre: ObjectId(theatreId),
                                isEnabled: true,
                                start_date_int: { $lte: showDate },
                                end_date_int: { $gte: showDate }
                            }
                        },
                        {
                            $lookup: {
                                from: collection.MOVIE_THEATRE_COLLECTION,
                                localField: 'movie',
                                foreignField: '_id',
                                as: 'movie_arr'
                            }
                        },
                        { $unwind: "$movie_arr" },
                        {
                            $lookup: {
                                from: collection.MOVIE_COLLECTION,
                                localField: 'movie_arr.movie',
                                foreignField: '_id',
                                as: 'movie_details'
                            }
                        },
                        { $unwind: "$movie_details" },
                        {
                            $lookup: {
                                from: collection.SCREEN_COLLECTION,
                                localField: 'screen',
                                foreignField: '_id',
                                as: 'screenDetails'
                            }
                        },
                        {
                            $unwind: '$screenDetails'
                        },
                        {
                            $match: {
                                'movie_details._id': ObjectId(show._id)
                            }
                        },
                        {
                            $project : {
                                '_id' : 1,
                                'movie_details' : 1,
                                'screenDetails' : 1,
                                'start_time' : 1,
                                'start_time_int' : 1
                            }
                        },
                        { $sort: { start_time_int: 1 } }
                    ]).toArray();
                }
            }
            return resolve({ status: true, theatre, shows })
        })
    },
    getSeatInfoLayout: (movieId, mappingId, date) => {
        let movie_date_arr = date.split('-');
        let showDate = parseInt(movie_date_arr[0] + '' + movie_date_arr[1] + '' + movie_date_arr[2]);

        const currentDay = new Date();
        let currentHour = currentDay.getHours();
        let currentMinutes = currentDay.getMinutes();

        if (currentHour < 10) {
            currentHour = '0' + currentHour;
        }
        if (currentMinutes < 10) {
            currentMinutes = '0' + currentMinutes;
        }
        const currentTime = parseInt(currentHour + '' + currentMinutes + '00');

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


        return new Promise(async (resolve, reject) => {
            let disabled = await db.get().collection(collection.NON_AVAILABLE_SEATS_COLLECTION).find(
                {
                    mapping_id : ObjectId(mappingId),
                    show_date : date
                }
            ).toArray();
            
            let disabledArr = disabled.map(a => a.seat);

            let movie = await db.get().collection(collection.MOVIE_COLLECTION).findOne(
                { _id: ObjectId(movieId) }
            )
            
            let mapping = [];
            if (currentDateInt == showDate){
            mapping = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate(
                [
                    {
                        $match: {
                            _id: ObjectId(mappingId),
                            start_date_int: { $lte: showDate },
                            end_date_int: { $gte: showDate },
                            start_time_int: { $gt: currentTime }
                        }
                    },
                    {
                        $lookup: {
                            from: collection.SCREEN_COLLECTION,
                            localField: 'screen',
                            foreignField: '_id',
                            as: 'screenDetail'
                        }
                    },
                    { $unwind: '$screenDetail' },
                    {
                        $lookup: {
                            from: collection.THEATRE_COLLECTION,
                            localField: 'theatre',
                            foreignField: '_id',
                            as: 'theatreDetail'
                        }
                    },
                    { $unwind: "$theatreDetail" },
                    {
                        $lookup: {
                            from: collection.DISTRICT_COLLECTION,
                            localField: 'theatreDetail.district',
                            foreignField: '_id',
                            as: 'districtDetail'
                        }
                    },
                    { $unwind: "$districtDetail" }
                ]
            ).toArray();
            }else if (currentDateInt < showDate){
                mapping = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate(
                    [
                        {
                            $match: {
                                _id: ObjectId(mappingId),
                                start_date_int: { $lte: showDate },
                                end_date_int: { $gte: showDate }
                            }
                        },
                        {
                            $lookup: {
                                from: collection.SCREEN_COLLECTION,
                                localField: 'screen',
                                foreignField: '_id',
                                as: 'screenDetail'
                            }
                        },
                        { $unwind: '$screenDetail' },
                        {
                            $lookup: {
                                from: collection.THEATRE_COLLECTION,
                                localField: 'theatre',
                                foreignField: '_id',
                                as: 'theatreDetail'
                            }
                        },
                        { $unwind: "$theatreDetail" },
                        {
                            $lookup: {
                                from: collection.DISTRICT_COLLECTION,
                                localField: 'theatreDetail.district',
                                foreignField: '_id',
                                as: 'districtDetail'
                            }
                        },
                        { $unwind: "$districtDetail" }
                    ]
                ).toArray();
            }else{
                return resolve({ status: false, errorMsg: "1. Bad Request" })
            }

            if (!mapping.length) {
                return resolve({ status: false, errorMsg: "1. Bad Request" })
            }


            let bookingsRes = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                {
                    $match: {
                        mapping: ObjectId(mappingId),
                        date_int: showDate,
                        isPaid: true,
                        isSuccess: true
                    }
                },
                { $unwind: '$original_seats' },
                {
                    $group: {
                        _id: "$original_seats"
                    }
                }
            ]).toArray();

            let bookings = bookingsRes.map(a => a._id);

            if (!movie || !mapping) {
                return resolve({ status: false, errorMsg: "Bad Request" })
            } else {
                return resolve({ status: true, movie, mapping: mapping[0], bookings, disabledArr })
            }
        });
    },
    doTicketBooking: (movieId, mappingId, date, userId, bookingData, remaining_minutes, remaining_seconds) => {

        let movie_date_arr = date.split('-');

        const MovieDate = new Date(parseInt(movie_date_arr[0]), parseInt(movie_date_arr[1]) - 1, parseInt(movie_date_arr[2]) + 1)

        const showDate = isodate(date);
        return new Promise(async (resolve, reject) => {

            bookingData.user = ObjectId(userId);
            bookingData.mapping = ObjectId(mappingId);
            bookingData.movieId = ObjectId(movieId);
            bookingData.movie_date = showDate;
            bookingData.booking_date = new Date();
            bookingData.date = date;
            bookingData.remaining_minutes = remaining_minutes;
            bookingData.remaining_seconds = remaining_seconds;
            bookingData.timeSet = 1;
            bookingData.date_int = parseInt(movie_date_arr[0] + '' + movie_date_arr[1] + '' + movie_date_arr[2])

            if (MovieDate < new Date()) {
                return resolve({ status: false, errorMsg: 'Bad Request, Date error' })
            }

            const movie = await db.get().collection(collection.MOVIE_COLLECTION).findOne({
                _id: ObjectId(movieId)
            })

            if (!movie) {
                return resolve({ status: false, errorMsg: "Bad Request" })
            }

            const mapping = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).findOne({
                _id: ObjectId(mappingId)
            })

            if (!mapping) {
                return resolve({ status: false, errorMsg: "Bad Request" })
            }

            let screen = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                { $match: { _id: ObjectId(mappingId) } },
                {
                    $lookup: {
                        from: collection.SCREEN_COLLECTION,
                        localField: 'screen',
                        foreignField: '_id',
                        as: 'screen_details'
                    }
                },
                { $unwind: '$screen_details' }
            ]).toArray();

            let screenDetails = screen[0].screen_details;
            bookingData.screen = ObjectId(screenDetails._id);

            bookingData.reclinerSeats = 0;
            bookingData.primeSeats = 0;
            bookingData.classic_plusSeats = 0;
            bookingData.classicSeats = 0;

            bookingData.reclinerPrice = 0;
            bookingData.primePrice = 0;
            bookingData.classic_plusPrice = 0;
            bookingData.classicPrice = 0;

            seat_type = bookingData.seat_type;
            original_seats = bookingData.original_seats;
            display_seats = bookingData.display_seats;

            if (!Array.isArray(seat_type)) {
                bookingData.seat_type = [bookingData.seat_type];
            }

            if (!Array.isArray(original_seats)) {
                bookingData.original_seats = [bookingData.original_seats];
            }

            if (!Array.isArray(display_seats)) {
                bookingData.display_seats = [bookingData.display_seats];
            }

            let alreadyBooked = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                {
                    $match: {
                        mapping: ObjectId(mappingId),
                        date_int: bookingData.date_int,
                        isSuccess: true,
                        isPaid: true
                    }
                },
                {
                    $unwind: '$original_seats'
                },
                {
                    $match: {
                        original_seats: { $in: bookingData.original_seats }
                    }
                }
            ]).toArray()

            if (alreadyBooked.length > 0) {
                return resolve({ status: false, errorMsg: 'Some error happened. Try again' })
            }

            for (types of bookingData.seat_type) {
                if (types == "recliner") {
                    bookingData.reclinerSeats++;
                    bookingData.reclinerPrice = bookingData.reclinerPrice + screenDetails.recliner_price
                }

                if (types == "prime") {
                    bookingData.primeSeats++;
                    bookingData.primePrice = bookingData.primePrice + screenDetails.prime_price
                }

                if (types == "classic_plus") {
                    bookingData.classic_plusSeats++;
                    bookingData.classic_plusPrice = bookingData.classic_plusPrice + screenDetails.classic_plus_price
                }

                if (types == "classic") {
                    bookingData.classicSeats++;
                    bookingData.classicPrice = bookingData.classicPrice + screenDetails.classic_price
                }

            }

            bookingData.totalAmount = bookingData.reclinerPrice + bookingData.primePrice + bookingData.classic_plusPrice + bookingData.classicPrice;

            await db.get().collection(collection.BOOKING_COLLECTION).insertOne(bookingData).then(async (response) => {
                const insertedId = response.insertedId;
                return resolve({ status: true, bookingId: insertedId })
            });
        });
    },
    getBookingDetails: (bookingId) => {
        return new Promise(async (resolve, reject) => {
            let bookingData = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                { $match: { _id: ObjectId(bookingId) } },
                {
                    $lookup: {
                        from: collection.SCREEN_COLLECTION,
                        localField: 'screen',
                        foreignField: '_id',
                        as: 'screen_details'
                    }
                },
                { $unwind: '$screen_details' },
                {
                    $lookup: {
                        from: collection.THEATRE_COLLECTION,
                        localField: 'screen_details.theatre',
                        foreignField: '_id',
                        as: 'theatre_details'
                    }
                },
                { $unwind: '$theatre_details' },
                {
                    $lookup: {
                        from: collection.MOVIE_SCREEN_COLLECTION,
                        localField: 'mapping',
                        foreignField: '_id',
                        as: 'mappingDetails'
                    }
                },
                { $unwind: '$mappingDetails' },
                {
                    $lookup: {
                        from: collection.MOVIE_COLLECTION,
                        localField: 'movieId',
                        foreignField: '_id',
                        as: 'movie_details'
                    }
                },
                { $unwind: '$movie_details' },
            ]).toArray();

            if (bookingData.length > 0) {
                bookingData = bookingData[0];
                if (bookingData.razorpay_response) {
                    return resolve({ status: false, errorMsg: 'Bad Request !' })
                }
                if (bookingData.timeSet == 1){
                    await db.get().collection(collection.BOOKING_COLLECTION).updateOne({
                        _id : ObjectId(bookingId)
                    },
                    {
                        $set : {
                            timeSet : 2
                        }
                    })
                }else{
                    return resolve({ status: false, errorMsg: 'Bad Request !' })
                }
                return resolve({ status: true, bookingData: bookingData })
            } else {
                return resolve({ status: false, errorMsg: 'Bad Request !' })
            }
        });
    },
    getTicketDetails: (bookingId) => {
        return new Promise(async (resolve, reject) => {
            let bookingData = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                { $match: { _id: ObjectId(bookingId) } },
                {
                    $lookup : {
                        from : collection.MOVIE_COLLECTION,
                        localField : 'movieId',
                        foreignField : '_id',
                        as : 'movieDetails'
                    }
                },
                {
                    $unwind : '$movieDetails'
                },
                {
                    $lookup : {
                        from : collection.SCREEN_COLLECTION,
                        localField : 'screen',
                        foreignField : '_id',
                        as : 'screenDetails'
                    }
                },
                {
                    $unwind : '$screenDetails'
                },
                {
                    $lookup : {
                        from : collection.THEATRE_COLLECTION,
                        localField : 'screenDetails.theatre',
                        foreignField : '_id',
                        as : 'theatreDetails'
                    }
                },
                {
                    $unwind : '$theatreDetails'
                },
                {
                    $lookup : {
                        from : collection.MOVIE_SCREEN_COLLECTION,
                        localField : 'mapping',
                        foreignField : '_id',
                        as : 'mappingDetails'
                    }
                },
                {
                    $unwind : '$mappingDetails'
                }
            ]).toArray();

            if (bookingData.length > 0) {
                bookingData = bookingData[0];
                return resolve({ status: true, bookingData: bookingData })
            } else {
                return resolve({ status: false, errorMsg: 'Bad Request !' })
            }
        });
    },
    doConfirmBooking: (bookingId) => {
        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.BOOKING_COLLECTION).findOne({ _id: ObjectId(bookingId) }).then(async (bookingData) => {
                if (bookingData.razorpay_response) {
                    return resolve({ status: false, errorMsg: 'Bad Request' });
                } else {
                    await instance.orders.create({
                        amount: bookingData.totalAmount * 100,
                        currency: "INR",
                        receipt: '' + bookingId
                    }, async function (err, order) {
                        await db.get().collection(collection.BOOKING_COLLECTION).updateOne({ _id: ObjectId(bookingId) }, {
                            $set: {
                                razorpay_response: order
                            }
                        }).then((updateResponse) => {
                            return resolve({ status: true, bookingId: bookingId, razorpay_response: order })
                        });
                    })
                }
            })
        });
    },
    getMovieInfo: (movieId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.MOVIE_COLLECTION).findOne({ _id: ObjectId(movieId) }).then((response) => {
                return resolve({ status: true, movie: response })
            })
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex');
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (bookingId, baseUrl) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BOOKING_COLLECTION).aggregate([ 
                {
                    $match : {
                        _id : ObjectId(bookingId) 
                    } 
                },
                {
                    $lookup : {
                        from : collection.MOVIE_COLLECTION,
                        localField : 'movieId',
                        foreignField : '_id',
                        as : 'movieDetails'
                    }
                },
                {
                    $unwind : '$movieDetails'
                },
                {
                    $lookup : {
                        from : collection.SCREEN_COLLECTION,
                        localField : 'screen',
                        foreignField : '_id',
                        as : 'screenDetails'
                    }
                },
                {
                    $unwind : '$screenDetails'
                },
                {
                    $lookup : {
                        from : collection.THEATRE_COLLECTION,
                        localField : 'screenDetails.theatre',
                        foreignField : '_id',
                        as : 'theatreDetails'
                    }
                },
                {
                    $unwind : '$theatreDetails'
                },
                {
                    $lookup : {
                        from : collection.MOVIE_SCREEN_COLLECTION,
                        localField : 'mapping',
                        foreignField : '_id',
                        as : 'mappingDetails'
                    }
                },
                {
                    $unwind : '$mappingDetails'
                }
            ]).toArray().then(async (booking) => {
                booking = booking[0]
                await db.get().collection(collection.MAIN_BOOKING_COLLECTION).findOne({ mapping : ObjectId(booking.mapping), date_int : parseInt(booking.date_int) }).then(async (mainBooking) => {
                    if (mainBooking){
                        mainBooking.bookingIds.push( ObjectId(bookingId) )
                        mainBooking.seatsBooked += ( booking.reclinerSeats + booking.primeSeats + booking.classic_plusSeats + booking.classicSeats )
                        mainBooking.reclinerSeats += booking.reclinerSeats
                        mainBooking.primeSeats += booking.primeSeats
                        mainBooking.classic_plusSeats += booking.classic_plusSeats
                        mainBooking.classicSeats += booking.classicSeats
                        mainBooking.reclinerPrice += booking.reclinerPrice
                        mainBooking.primePrice += booking.primePrice
                        mainBooking.classic_plusPrice += booking.classic_plusPrice
                        mainBooking.classicPrice += booking.classicPrice
                        mainBooking.totalAmount += booking.totalAmount
                        mainBooking.original_seats = mainBooking.original_seats.concat(booking.original_seats)
                        mainBooking.display_seats = mainBooking.display_seats.concat(booking.display_seats)

                                
                        await db.get().collection(collection.MAIN_BOOKING_COLLECTION).updateOne(
                            { _id : ObjectId(mainBooking._id) }, 
                            {
                                $set : {
                                    seatsBooked : mainBooking.seatsBooked,
                                    reclinerSeats : mainBooking.reclinerSeats,
                                    primeSeats : mainBooking.primeSeats,
                                    classic_plusSeats : mainBooking.classic_plusSeats,
                                    classicSeats : mainBooking.classicSeats,
                                    reclinerPrice : mainBooking.reclinerPrice,
                                    primePrice : mainBooking.primePrice,
                                    classic_plusPrice : mainBooking.classic_plusPrice,
                                    classicPrice : mainBooking.classicPrice,
                                    totalAmount : mainBooking.totalAmount,
                                    bookingIds : mainBooking.bookingIds,
                                    original_seats : mainBooking.original_seats,
                                    display_seats : mainBooking.display_seats
                                }
                            }
                        )
                    }else{
                        await db.get().collection(collection.MAIN_BOOKING_COLLECTION).insertOne({
                            mapping : ObjectId(booking.mapping), 
                            date_int : parseInt(booking.date_int),
                            seatsBooked : booking.reclinerSeats + booking.primeSeats + booking.classic_plusSeats + booking.classicSeats,
                            reclinerSeats : booking.reclinerSeats,
                            primeSeats : booking.primeSeats,
                            classic_plusSeats : booking.classic_plusSeats,
                            classicSeats : booking.classicSeats,
                            reclinerPrice : booking.reclinerPrice,
                            primePrice : booking.primePrice,
                            classic_plusPrice : booking.classic_plusPrice,
                            classicPrice : booking.classicPrice,
                            totalAmount : booking.totalAmount,
                            bookingIds : [ ObjectId(bookingId) ],
                            screen : ObjectId(booking.screen),
                            original_seats : booking.original_seats ,
                            display_seats : booking.display_seats
                        })
                    }
                    

                    await QRCode.toDataURL(
                        `
                        ${baseUrl}get_ticket_details/${booking._id}
                        `
                    )
                        .then(async (url) => {
                            await db.get().collection(collection.BOOKING_COLLECTION).updateOne({ _id: ObjectId(bookingId) }, {
                                $set: { 
                                    isPaid: true, 
                                    isSuccess: true,
                                    qrCode : url
                                }
                            })

                            return resolve({ status: true })
                        })
                        .catch(err => {
                            return resolve({ status: false })
                        })
                })
            })
        })
    },
    getUsertickets: (userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                {
                    $match: {
                        user: ObjectId(userId),
                        isSuccess: true,
                        isPaid: true
                    }
                },
                {
                    $lookup: {
                        from: collection.MOVIE_COLLECTION,
                        localField: 'movieId',
                        foreignField: '_id',
                        as: 'movieDetails'
                    }
                },
                {
                    $unwind: '$movieDetails'
                },
                {
                    $lookup: {
                        from: collection.SCREEN_COLLECTION,
                        localField: 'screen',
                        foreignField: '_id',
                        as: 'screenDetails'
                    }
                },
                {
                    $unwind: '$screenDetails'
                },
                {
                    $lookup: {
                        from: collection.THEATRE_COLLECTION,
                        localField: 'screenDetails.theatre',
                        foreignField: '_id',
                        as: 'theatreDetails'
                    }
                },
                {
                    $unwind: '$theatreDetails'
                },
                {
                    $lookup: {
                        from: collection.MOVIE_SCREEN_COLLECTION,
                        localField: 'mapping',
                        foreignField: '_id',
                        as: 'mappingDetails'
                    }
                },
                {
                    $unwind: '$mappingDetails'
                },
                {
                    $sort: { 
                        date_int: -1,
                        'mappingDetails.start_time_int' : 1
                    }
                }
            ]).toArray().then((tickets) => {
                return resolve({ status: true, tickets })
            })
        })
    },
    getMovieShows : (movieId, showDateInt, currentDayInt) => {

        const currentDay = new Date();
        let currentHour = currentDay.getHours();
        let currentMinutes = currentDay.getMinutes();
        if (currentHour < 10) {
            currentHour = '0' + currentHour;
        }
        if (currentMinutes < 10) {
            currentMinutes = '0' + currentMinutes;
        }
        const currentTime = parseInt(currentHour + '' + currentMinutes + '00');


        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.MOVIE_COLLECTION).findOne({ _id : ObjectId(movieId) }).then(async (movie) => {
                await db.get().collection(collection.MOVIE_THEATRE_COLLECTION).aggregate([
                    {
                        $match : {
                            movie : ObjectId(movieId),
                            isEnabled : true
                        }
                    },
                    {
                        $lookup : {
                            from : collection.THEATRE_COLLECTION,
                            localField : 'theatre',
                            foreignField : '_id',
                            as : 'theatreDetails'
                        }
                    },
                    {
                        $unwind : '$theatreDetails'
                    }
                ]).toArray().then(async (theatreMappings) => {
                    let theatreMappingsNew = [];
                    for (let i = 0; i < theatreMappings.length; i++){
                        let currentTheatreMapping = theatreMappings[i];
                        let shows = [];
                        if (currentDayInt == showDateInt){
                            shows = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate(
                                [
                                    {
                                        $match: {
                                            movie : ObjectId(theatreMappings[i]._id),
                                            start_date_int : { $lte : showDateInt},
                                            end_date_int : { $gte : showDateInt },
                                            isEnabled : true,
                                            start_time_int: { $gt: currentTime }
                                        }
                                    },
                                    {
                                        $lookup : {
                                            from : collection.SCREEN_COLLECTION,
                                            localField : 'screen',
                                            foreignField : '_id',
                                            as : 'screenDetails'
                                        }
                                    },
                                    {
                                        $unwind : '$screenDetails'
                                    },
                                    {
                                        $sort : {
                                            'start_time_int' : 1
                                        }
                                    }
                                ]
                            ).toArray();
                        }else{
                            shows = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate(
                                [
                                    {
                                        $match: {
                                            movie : ObjectId(theatreMappings[i]._id),
                                            start_date_int : { $lte : showDateInt},
                                            end_date_int : { $gte : showDateInt },
                                            isEnabled : true
                                        }
                                    },
                                    {
                                        $lookup : {
                                            from : collection.SCREEN_COLLECTION,
                                            localField : 'screen',
                                            foreignField : '_id',
                                            as : 'screenDetails'
                                        }
                                    },
                                    {
                                        $unwind : '$screenDetails'
                                    },
                                    {
                                        $sort : {
                                            'start_time_int' : 1
                                        }
                                    }
                                ]
                            ).toArray();
                        }
                        if (shows.length > 0){
                            currentTheatreMapping.shows = shows;
                            theatreMappingsNew.push(currentTheatreMapping);
                        }
                    }
                    return resolve({ status : true, movie, theatreMappings :  theatreMappingsNew })
                })
            })
        })
    },
    deleteExistingDisabled : (currentTime) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.NON_AVAILABLE_SEATS_COLLECTION).deleteMany({
                end_time : { $lte : currentTime }
            }).then((response) => {
                return resolve(response);
            })
        })
    },
    deleteExistingUserMappedDisabled : (userId, mappingId, date) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.NON_AVAILABLE_SEATS_COLLECTION).deleteMany({
                userId : ObjectId(userId),
                show_date : date,
                mapping_id : ObjectId(mappingId)
            }).then((response) => {
                return resolve(response);
            })
        })
    },
    addDisabled : (userId, showDate, originalSeatArr, currentTime, endTime, mapping_id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.NON_AVAILABLE_SEATS_COLLECTION).deleteMany({
                userId : ObjectId(userId),
                show_date : showDate,
                mapping_id : ObjectId(mapping_id),
            });
            if (Array.isArray(originalSeatArr)){
                for (let i = 0; i < originalSeatArr.length; i++){
                    await db.get().collection(collection.NON_AVAILABLE_SEATS_COLLECTION).insertOne({
                        end_time : endTime,
                        current_time : currentTime,
                        userId : ObjectId(userId),
                        show_date : showDate,
                        mapping_id : ObjectId(mapping_id),
                        seat : originalSeatArr[i]
                    })
                }
            }else{
                await db.get().collection(collection.NON_AVAILABLE_SEATS_COLLECTION).insertOne({
                    end_time : endTime,
                    current_time : currentTime,
                    userId : ObjectId(userId),
                    show_date : showDate,
                    mapping_id : ObjectId(mapping_id),
                    seat : originalSeatArr
                })
            }
            resolve();
        })
    },
    getUserEmail : (userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).findOne({ _id : ObjectId(userId) }).then((user) => {
                if (user){
                    return resolve(user.email);
                }else{
                    return resolve('chinnuharidas23@gmail.com')
                }
            })
        })
    },
    likeMovieReview : (reviewId, userId) => {
        return new Promise(async (resolve, reject) => {
            let review = await db.get().collection(collection.REVIEW_COLLECTION).findOne({ _id : ObjectId(reviewId) })
            if (review.like_users.indexOf(userId ) != -1){
                return resolve({ status : true, likes : review.likes, dislikes : review.dislikes })
            }
            if (review.dislike_users.indexOf(userId ) != -1){
                let dislike_users = review.dislike_users;
                let index = dislike_users.indexOf(userId )
                dislike_users.splice(index, 1);
                await db.get().collection(REVIEW_COLLECTION).updateOne({_id : ObjectId(reviewId)},
                    {
                        $set : {
                            dislike_users : dislike_users
                        },
                        $inc : {
                            likes : 1,
                            dislikes : -1
                        },
                        $push : {
                            like_users : userId
                        }
                    }
                )
                return resolve({ status : true, likes : review.likes + 1, dislikes : review.dislikes - 1 })
            }
            if (review.like_users.indexOf(userId ) == -1 && 
                review.dislike_users.indexOf(userId ) == -1){
                    await db.get().collection(REVIEW_COLLECTION).updateOne({_id : ObjectId(reviewId)},
                    {
                        $inc : {
                            likes : 1,
                        },
                        $push : {
                            like_users : userId
                        }
                    }
                )
                return resolve({ status : true, likes : review.likes + 1, dislikes : review.dislikes })
            }
            return resolve({ status : true })
        })
    },
    dislikeMovieReview : (reviewId, userId) => {
        return new Promise(async (resolve, reject) => {
            let review = await db.get().collection(collection.REVIEW_COLLECTION).findOne({ _id : ObjectId(reviewId) })
            if (review.dislike_users.indexOf(userId) != -1){
                console.log('case 1')
                return resolve({ status : true, likes : review.likes, dislikes : review.dislikes })
            }
            if (review.like_users.indexOf(userId ) != -1){
                console.log('case 2')
                let like_users = review.like_users;
                let index = like_users.indexOf(userId)
                like_users.splice(index, 1);
                await db.get().collection(REVIEW_COLLECTION).updateOne({_id : ObjectId(reviewId)},
                    {
                        $set : {
                            like_users : like_users
                        },
                        $inc : {
                            likes : -1,
                            dislikes : 1
                        },
                        $push : {
                            dislike_users : userId
                        }
                    }
                )
                return resolve({ status : true, likes : review.likes - 1, dislikes : review.dislikes + 1 })
            }
            if (review.like_users.indexOf(userId ) == -1 && 
                review.dislike_users.indexOf(userId ) == -1){
                    console.log('case 3')
                    await db.get().collection(REVIEW_COLLECTION).updateOne({_id : ObjectId(reviewId)},
                    {
                        $inc : {
                            dislikes : 1,
                        },
                        $push : {
                            dislike_users : userId
                        }
                    }
                )
                return resolve({ status : true, likes : review.likes, dislikes : review.dislikes + 1})
            }
            return resolve({ status : true })
        })
    },
    submitReview : (formData, userId) => {
        return new Promise(async (resolve, reject) => {
            let insertObj = {};
            let movie = await db.get().collection(collection.MOVIE_COLLECTION).findOne({ _id : ObjectId(formData.movie) });
            if (!movie){
                return resolve({ status : false, errorMsg : 'Movie not found' })
            }
            let ratedUsers = movie.ratedUsers;
            let totalRating = movie.totalRating;
            let usersRating = movie.usersRating;
            if (!ratedUsers){
                ratedUsers = 0;
            }
            if (!totalRating){
                totalRating = 0;
            }

            totalRating = totalRating + parseFloat(formData.rating);
            ratedUsers = ratedUsers + 1;
            usersRating = parseFloat(totalRating / ratedUsers);

            await db.get().collection(collection.MOVIE_COLLECTION).updateOne( { _id : ObjectId(formData.movie) }, {
                $set : {
                    totalRating : Math.round(totalRating * 100) / 100,
                    ratedUsers : ratedUsers,
                    usersRating : usersRating,
                }
            })

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

            insertObj = {
                user : ObjectId(userId),
                movie : ObjectId(formData.movie),
                date : currentDayJoined,
                isVerified : false,
                isActive : true,
                rating : parseFloat(formData.rating),
                text: formData.text,
                title: formData.title,
                dislikes : 0,
                likes : 0,
                dislike_users : [],
                like_users : []
            }

            await db.get().collection(collection.REVIEW_COLLECTION).insertOne(insertObj).then((response) => {
                return resolve({ status : true, _id : movie._id, api_id : movie.api_movie_id })
            })
        })
    },
    getUserMovieReview : (userId, movieId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.REVIEW_COLLECTION).findOne({ movie : ObjectId(movieId), user : ObjectId(userId) })
            .then((result) => {
                if (result){
                    return resolve({status : true})
                }else{
                    return resolve({ status : false })
                }
            })
        })
    },
    getUserMovieBooking : (userId, movieId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BOOKING_COLLECTION)
            .findOne({ movieId : ObjectId(movieId), user : ObjectId(userId) })
            .then((result) => {
                if (result){
                    return resolve({status : true})
                }else{
                    return resolve({ status : false })
                }
            })
        })
    },
}