var db = require('../config/connection')
var collection = require('../config/collections')
const { ObjectId } = require('mongodb');

module.exports = {
    doAdminLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            var response = {}
            var adminuser = await db.get().collection(collection.ADMIN_USER_COLLECTION).findOne({ email: userData.email, password: userData.password, isAdmin: true })
            if (adminuser) {
                response.adminuser = adminuser
                response.status = true
                resolve(response)
            } else {
                resolve({ status: false })
            }
        })
    },
    getMovieWiseRevenue: (StartDateInt, EndDateInt, currentYear) => {
        let tr_theatreArr = [];
        let tr_revenueArr = [];
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                {
                    $match: {
                        isSuccess: true,
                        isPaid: true,
                        $and: [
                            { date_int: { $gte: StartDateInt } },
                            { date_int: { $lte: EndDateInt } }
                        ]
                    }
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
                    $group: {
                        _id: '$movieId',
                        totalRevenue: { $sum: '$totalAmount' }
                    }
                },
                {
                    $lookup: {
                        from: collection.MOVIE_COLLECTION,
                        localField: '_id',
                        foreignField: '_id',
                        as: 'movieDetails'
                    }
                },
                {
                    $unwind: '$movieDetails'
                },
                {
                    $project: {
                        'movieDetails.title': 1,
                        totalRevenue: 1
                    }
                }
            ]).toArray().then(async (response) => {
                let yearArray = [];

                for (let i = 1; i <= 12; i++) {

                    let currentMonth = '';
                    if (i < 10) {
                        currentMonth = '0' + i;
                    } else {
                        currentMonth = i
                    }
                    let monthStartDate = parseInt(currentYear + '' + currentMonth + '01');
                    let monthEndDate = parseInt(currentYear + '' + currentMonth + '31');

                    let monthlyRevenue = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                        {
                            $match: {
                                isSuccess: true,
                                isPaid: true,
                                $and: [
                                    { date_int: { $gte: monthStartDate } },
                                    { date_int: { $lte: monthEndDate } }
                                ]
                            }
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
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: "$totalAmount" }
                            }
                        }
                    ]).toArray()

                    if (monthlyRevenue.length > 0) {
                        yearArray.push(monthlyRevenue[0].totalRevenue);
                    } else {
                        yearArray.push(0);
                    }
                }

                await db.get().collection(collection.SCREEN_COLLECTION).aggregate([
                    { $match: { isEnabled: true } },
                    {
                        $lookup: {
                            from: collection.THEATRE_COLLECTION,
                            localField: 'theatre',
                            foreignField: '_id',
                            as: 'theatreDetails'
                        }
                    },
                    {
                        $unwind: '$theatreDetails'
                    },
                    {
                        $sort: { 'theatreDetails._id': 1 }
                    }
                ]).toArray().then(async (screenTemp) => {
                    let screens = [];
                    screenRevenue = [];
                    for (let j = 0; j < screenTemp.length; j++) {
                        let revenue = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                            {
                                $match: {
                                    isSuccess: true,
                                    isPaid: true,
                                    $and: [
                                        { date_int: { $gte: StartDateInt } },
                                        { date_int: { $lte: EndDateInt } }
                                    ],
                                    screen: ObjectId(screenTemp[j]._id)
                                }
                            },
                            {
                                $group: {
                                    _id: '$screen',
                                    totalRevenue: { $sum: '$totalAmount' }
                                }
                            },
                        ]).toArray();
                        if (revenue.length > 0) {
                            screens.push(screenTemp[j]);
                            screenRevenue.push(revenue[0].totalRevenue)
                        }
                    }







                    let theatreRevenues = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                        {
                            $match: {
                                isSuccess: true,
                                isPaid: true,
                                $and: [
                                    { date_int: { $gte: StartDateInt } },
                                    { date_int: { $lte: EndDateInt } }
                                ]
                            }
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
                            $group: {
                                _id: '$theatreDetails._id',
                                totalRevenue: { $sum: '$totalAmount' }
                            }
                        },
                        {
                            $lookup: {
                                from: collection.THEATRE_COLLECTION,
                                localField: '_id',
                                foreignField: '_id',
                                as: 'theatreDetailsNew'
                            }
                        },
                        {
                            $unwind: '$theatreDetailsNew'
                        },
                        {
                            $project: {
                                'theatreDetailsNew.name': 1,
                                totalRevenue: 1
                            }
                        }
                    ]).toArray();

                    for (let k = 0; k < theatreRevenues.length; k++) {
                        tr_theatreArr.push(theatreRevenues[k].theatreDetailsNew.name)
                        tr_revenueArr.push(theatreRevenues[k].totalRevenue)
                    }



                    return resolve({ movies: response, yearArray, screens, screenRevenue, tr_revenueArr, tr_theatreArr })
                })

            })
        })
    },
    getTodaysTheatreShows: (theatreId) => {
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
        let showDate = currentDateInt

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

            for (show of shows) {
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
                        $project: {
                            '_id': 1,
                            'movie_details': 1,
                            'screenDetails': 1,
                            'start_time': 1,
                            'start_time_int': 1
                        }
                    },
                    { $sort: { start_time_int: 1 } }
                ]).toArray();
            }
            return resolve({ status: true, theatre, shows })
        })
    },
    getSeatInfoLayout: (movieId, mappingId) => {
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
        let showDate = currentDateInt


        return new Promise(async (resolve, reject) => {
            let movie = await db.get().collection(collection.MOVIE_COLLECTION).findOne(
                { _id: ObjectId(movieId) }
            )

            let mapping = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate(
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
                return resolve({ status: true, movie, mapping: mapping[0], bookings })
            }
        });
    },
    getEnabledMovies: () => {
        return new Promise(async (resolve, reject) => {
            var movies = await db.get().collection(collection.MOVIE_THEATRE_COLLECTION).aggregate([
                { $match: { isEnabled: true } },
                {
                    $lookup: {
                        from: collection.MOVIE_COLLECTION,
                        localField: 'movie',
                        foreignField: '_id',
                        as: 'movie_arr'
                    }
                },
                {
                    $unwind: '$movie_arr'
                }
            ]).toArray()

            resolve(movies)
        })
    },
    getRevenues : (reqBody) => {
        return new Promise(async (resolve, reject) => {
            let results = [];
            if (reqBody){
                let movie = reqBody.report_movie;
                let screen = reqBody.report_screen;

                let conditions = {};

                if (movie){
                    let movieMap = await db.get().collection(collection.MOVIE_THEATRE_COLLECTION).findOne({
                        _id : ObjectId(movie)
                    })
                    conditions['movieDetails._id'] = ObjectId(movieMap.movie)
                }

                if (screen){
                    conditions['screenDetails._id'] = ObjectId(screen);
                }

                results = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                    {
                        $match : {
                            isSuccess : true,
                            isPaid : true
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
                            from : collection.MOVIE_SCREEN_COLLECTION,
                            localField : 'mapping',
                            foreignField : '_id',
                            as : 'mappingDetails'
                        }
                    },
                    {
                        $unwind : '$mappingDetails'
                    },
                    {
                        $match : conditions
                    },
                    {
                        $sort : { date_int : -1 }
                    }
                ]).toArray();

            }else{
                results = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                    {
                        $match : {
                            isSuccess : true,
                            isPaid : true
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
                            from : collection.MOVIE_SCREEN_COLLECTION,
                            localField : 'mapping',
                            foreignField : '_id',
                            as : 'mappingDetails'
                        }
                    },
                    {
                        $unwind : '$mappingDetails'
                    },
                    {
                        $sort : { date_int : -1 }
                    }
                ]).toArray();
            }

            return resolve(results)
        })
    },
    getRevenuesMonthWise : (reqBody) => {
        return new Promise(async (resolve, reject) => {
            let results = [];
            if (reqBody){
                let movieMonth = reqBody.report_movie;
                movieMonth = movieMonth.split('/');

                let start = parseInt(movieMonth[1] + '' + movieMonth[0] + '' + '01');
                let end = parseInt(movieMonth[1] + '' + movieMonth[0] + '' + '31');

                console.log(start, end)

                results = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                    {
                        $match : {
                            isSuccess : true,
                            isPaid : true
                        }
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
                        $match : {
                            $and : [
                                {
                                    date_int : { $gte : start },
                                },
                                {
                                    date_int : { $lte : end }
                                }
                            ]
                        }
                    },
                    {
                        $group : {
                        "_id": {
                            "theare_id": "$theatreDetails._id",
                            "name": "$theatreDetails.name",
                            "date" : "$date",
                            "date_int" : "$date_int"
                        },
                        "sum": { "$sum": "$totalAmount" }
                    }},
                    {
                        $sort : { '_id.date_int' : -1 }
                    }
                ]).toArray();

            }else{
                results = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                    {
                        $match : {
                            isSuccess : true,
                            isPaid : true
                        }
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
                        $group : {
                        "_id": {
                            "theare_id": "$theatreDetails._id",
                            "name": "$theatreDetails.name",
                            "date" : "$date",
                            "date_int" : '$date_int'
                        },
                        "sum": { "$sum": "$totalAmount" }
                    }},
                    {
                        $sort : { '_id.date_int' : -1 }
                    }
                ]).toArray();
            }

            return resolve(results)
        })
    },
    disverifyReview : (reviewId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.REVIEW_COLLECTION).updateOne({ _id : ObjectId(reviewId) }, {
                $set : {
                    isVerified : false
                }
            }).then((response) => {
                return resolve(true)
            })
        })
    },
    verifyReview : (reviewId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.REVIEW_COLLECTION).updateOne({ _id : ObjectId(reviewId) }, {
                $set : {
                    isVerified : true
                }
            }).then((response) => {
                return resolve(true)
            })
        })
    },
    deactiveReview : (reviewId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.REVIEW_COLLECTION).updateOne({ _id : ObjectId(reviewId) }, {
                $set : {
                    isActive : false
                }
            }).then((response) => {
                return resolve(true)
            })
        })
    },
    activeReview : (reviewId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.REVIEW_COLLECTION).updateOne({ _id : ObjectId(reviewId) }, {
                $set : {
                    isActive : true
                }
            }).then((response) => {
                return resolve(true)
            })
        })
    },
}