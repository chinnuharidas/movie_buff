var db = require('../config/connection')
var collection = require('../config/collections')
const { ObjectId } = require('mongodb');
var isodate = require("isodate");

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

module.exports = {
    doOwnerLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            var response = {}
            var owneruser = await db.get().collection(collection.THEATRE_COLLECTION).findOne({ status: "approved", owner_mobile: userData.owner_mobile, password: userData.password })
            if (owneruser) {

                owneruser.profilePicUrl = null;
                if (owneruser.profilePic) {
                    let docs = await db.get().collection('images.files').find({ _id: owneruser.profilePic }).toArray();

                    if (docs[0]) {
                        const chunks = await db.get().collection('images.chunks').find({ files_id: docs[0]._id }).sort({ n: 1 }).toArray();
                        let fileData = [];
                        for (let i = 0; i < chunks.length; i++) {
                            fileData.push(chunks[i].data.toString('base64'));
                        }
                        let finalFile = 'data:' + docs[0].contentType + ';base64,' + fileData.join('');
                        response.profilePicUrl = finalFile;
                    }
                }

                response.owneruser = owneruser
                response.status = true
                resolve(response)
            } else {
                var ownerUserNotApproved = await db.get().collection(collection.THEATRE_COLLECTION).findOne({ owner_mobile: userData.owner_mobile, password: userData.password })
                if (ownerUserNotApproved) {
                    if (ownerUserNotApproved.status_update_remarks) {
                        resolve({ status: false, errorMsg: "Theatre Login not approved. Remarks : " + ownerUserNotApproved.status_update_remarks })
                    } else {
                        resolve({ status: false, errorMsg: "Theatre Login not approved" })
                    }
                } else {
                    resolve({ status: false, errorMsg: "Invalid Username or Password" })
                }

            }
        })
    },
    doOwnerSignUp: (ownerData) => {
        ownerData.createdAt = new Date();
        ownerData.status = "pending";
        ownerData.district = ObjectId(ownerData.district);
        return new Promise(async (resolve, reject) => {
            if (ownerData.password != ownerData.confirmpassword) {
                return resolve({ status: false, errorMsg: "Password Mismatch" });
            }
            var ownerByEmail = await db.get().collection(collection.THEATRE_COLLECTION).findOne({ owner_email: ownerData.owner_email })
            if (ownerByEmail) {
                return resolve({ status: false, errorMsg: 'Email already assigned to another user' })
            }
            var ownerByMobile = await db.get().collection(collection.THEATRE_COLLECTION).findOne({ owner_mobile: ownerData.owner_mobile })
            if (ownerByMobile) {
                return resolve({ status: false, errorMsg: 'Mobile already assigned to another user' })
            }
            ownerData.isEnabled = true;
            db.get().collection(collection.THEATRE_COLLECTION).insertOne(ownerData).then((data) => {
                resolve({ status: true, userId: data.insertedId })
            })
        })
    },
    doOwnerCheck: (ownerData) => {
        return new Promise(async (resolve, reject) => {
            if (ownerData.email) {
                var userByEmail = await db.get().collection(collection.THEATRE_COLLECTION).findOne({ owner_email: ownerData.email })
                if (userByEmail) {
                    return resolve({ status: false, errorMsg: 'Email already assigned to another user' })
                }
            }
            var userByMobile = await db.get().collection(collection.THEATRE_COLLECTION).findOne({ owner_mobile: ownerData.mobile })
            if (userByMobile) {
                return resolve({ status: false, errorMsg: 'Mobile already assigned to another user' })
            }

            userByMobile = await db.get().collection(collection.THEATRE_COLLECTION).findOne({ owner_mobile: ownerData.mobile.substring(3) })
            if (userByMobile) {
                return resolve({ status: false, errorMsg: 'Mobile already assigned to another user' })
            }

            return resolve({ status: true })
        })
    },
    doOwnerCheckByMobile: (mobile) => {
        return new Promise(async (resolve, reject) => {
            var response = {};
            var owneruser = await db.get().collection(collection.THEATRE_COLLECTION)
                .findOne({
                    status: "approved",
                    owner_mobile: mobile
                })

            if (owneruser) {

                owneruser.profilePicUrl = null;
                if (owneruser.profilePic) {
                    let docs = await db.get().collection('images.files').find({ _id: owneruser.profilePic }).toArray();

                    if (docs[0]) {
                        const chunks = await db.get().collection('images.chunks').find({ files_id: docs[0]._id }).sort({ n: 1 }).toArray();
                        let fileData = [];
                        for (let i = 0; i < chunks.length; i++) {
                            fileData.push(chunks[i].data.toString('base64'));
                        }
                        let finalFile = 'data:' + docs[0].contentType + ';base64,' + fileData.join('');
                        response.profilePicUrl = finalFile;
                    }
                }

                response.owneruser = owneruser
                response.status = true
                resolve(response)
            } else {
                var ownerUserNotApproved = await db.get().collection(collection.THEATRE_COLLECTION).findOne({ owner_mobile: mobile })
                if (ownerUserNotApproved) {
                    if (ownerUserNotApproved.status_update_remarks) {
                        resolve({ status: false, errorMsg: "Theatre Login not approved. Remarks : " + ownerUserNotApproved.status_update_remarks })
                    } else {
                        resolve({ status: false, errorMsg: "Theatre Login not approved" })
                    }
                } else {
                    resolve({ status: false, errorMsg: "Invalid Username or Password" })
                }

            }

        })

    },
    addScreenToTheatre: (theatreId, screenData) => {
        screenData.createdAt = new Date();
        screenData.theatre = ObjectId(theatreId);
        screenData.rows = parseInt(screenData.rows);
        screenData.columns = parseInt(screenData.columns);
        screenData.recliner = parseInt(screenData.recliner);
        screenData.prime = parseInt(screenData.prime);
        screenData.classic_plus = parseInt(screenData.classic_plus);
        screenData.classic = parseInt(screenData.classic);
        screenData.recliner_price = parseInt(screenData.recliner_price);
        screenData.prime_price = parseInt(screenData.prime_price);
        screenData.classic_plus_price = parseInt(screenData.classic_plus_price);
        screenData.classic_price = parseInt(screenData.classic_price);

        if (screenData['deleted[]']) {
            screenData.deleted = screenData['deleted[]'];
        }

        return new Promise(async (resolve, reject) => {
            var screenByName = await db.get().collection(collection.SCREEN_COLLECTION).findOne({ theatre: ObjectId(theatreId), name: screenData.name })
            if (screenByName) {
                return resolve({ status: false, errorMsg: 'Screen Name already assigned' })
            }
            screenData.isEnabled = true;

            let finalDeleted = [];

            if (screenData.deleted) {
                for (deletedElem of screenData.deleted) {
                    if (screenData.columns >= parseInt(deletedElem.substring(1))) {
                        let deletedRow = deletedElem.substring(0, 1);
                        if (screenData.rows >= alphabet_arr.indexOf(deletedRow)) {
                            finalDeleted.push(deletedElem)
                        }
                    }
                }
            }

            screenData.deleted = finalDeleted;
            screenData['deleted[]'] = finalDeleted;

            screenData.numberOfSeats = (screenData.rows * screenData.columns) - finalDeleted.length

            await db.get().collection(collection.SCREEN_COLLECTION).insertOne(screenData).then((data) => {
                resolve({ status: true, screenId: data.insertedId })
            })
        })
    },
    getScreenById: (screenId) => {
        return new Promise(async (resolve, reject) => {
            var screen = await db.get().collection(collection.SCREEN_COLLECTION).find(
                { _id: ObjectId(screenId) }
            ).toArray()
            resolve({ status: true, screen: screen[0] })
        })
    },
    updateScreen: (screenId, screenData) => {
        screenData.updatedAt = new Date();
        screenData.rows = parseInt(screenData.rows);
        screenData.columns = parseInt(screenData.columns);
        screenData.recliner = parseInt(screenData.recliner);
        screenData.prime = parseInt(screenData.prime);
        screenData.classic_plus = parseInt(screenData.classic_plus);
        screenData.classic = parseInt(screenData.classic);
        screenData.recliner_price = parseInt(screenData.recliner_price);
        screenData.prime_price = parseInt(screenData.prime_price);
        screenData.classic_plus_price = parseInt(screenData.classic_plus_price);
        screenData.classic_price = parseInt(screenData.classic_price);

        if (screenData['deleted[]']) {
            screenData.deleted = screenData['deleted[]'];
        }

        return new Promise(async (resolve, reject) => {
            let finalDeleted = [];
            var screen = await db.get().collection(collection.SCREEN_COLLECTION).findOne(
                { _id: ObjectId(screenId) })
            if (screen) {
                if (screenData.deleted) {
                    for (deletedElem of screenData.deleted) {
                        if (screenData.columns >= parseInt(deletedElem.substring(1))) {
                            let deletedRow = deletedElem.substring(0, 1);
                            if (screenData.rows >= alphabet_arr.indexOf(deletedRow)) {
                                finalDeleted.push(deletedElem)
                            }
                        }
                    }
                }

                screenData.deleted = finalDeleted;
                screenData['deleted[]'] = finalDeleted;

                screenData.numberOfSeats = (screenData.rows * screenData.columns) - finalDeleted.length

                const data = await db.get().collection(collection.SCREEN_COLLECTION).updateOne(
                    { _id: ObjectId(screenId) }, { $set: screenData })
                return resolve({ status: true })
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    disableScreen: (screenId) => {
        return new Promise(async (resolve, reject) => {
            var screen = await db.get().collection(collection.SCREEN_COLLECTION).findOne(
                { _id: ObjectId(screenId) })
            if (screen) {
                await db.get().collection(collection.SCREEN_COLLECTION)
                    .updateOne(
                        { _id: ObjectId(screenId) },
                        { $set: { isEnabled: false, updatedAt: new Date() } }
                    ).then(() => {
                        db.get().collection(collection.MOVIE_SCREEN_COLLECTION)
                            .updateMany(
                                { screen: ObjectId(screenId) },
                                { $set: { isEnabled: false, updatedAt: new Date() } }
                            )
                    })
                return resolve({ status: true })
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    enableScreen: (screenId) => {
        return new Promise(async (resolve, reject) => {
            var screen = await db.get().collection(collection.SCREEN_COLLECTION).findOne(
                { _id: ObjectId(screenId) })
            if (screen) {
                const data = await db.get().collection(collection.SCREEN_COLLECTION).findOneAndUpdate(
                    { _id: ObjectId(screenId) }, { $set: { isEnabled: true, updatedAt: new Date() } }, { returnNewDocument: true })
                return resolve({ status: true, data: data.value })
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    getMoviesByTheatre: (theatreId) => {
        return new Promise(async (resolve, reject) => {
            var movies = await db.get().collection(collection.MOVIE_THEATRE_COLLECTION).aggregate([
                { $match: { theatre: ObjectId(theatreId) } },
                {
                    $lookup: {
                        from: collection.MOVIE_COLLECTION,
                        localField: 'movie',
                        foreignField: '_id',
                        as: 'movie_arr'
                    }
                }
            ]).toArray()

            resolve(movies)
        })
    },
    getEnabledMoviesByTheatre: (theatreId) => {
        return new Promise(async (resolve, reject) => {
            var movies = await db.get().collection(collection.MOVIE_THEATRE_COLLECTION).aggregate([
                { $match: { theatre: ObjectId(theatreId), isEnabled: true } },
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
    addMovieToTheatre: (theatreId, movieData, movieFromAPI) => {
        movieData.createdAt = new Date();
        movieData.theatre = ObjectId(theatreId);
        movieData.isEnabled = true;

        return new Promise(async (resolve, reject) => {

            db.get().collection(collection.MOVIE_COLLECTION).findOne({ api_movie_id: movieData.api_movie_id }).then((MovieExist) => {

                db.get().collection(collection.MOVIE_THEATRE_COLLECTION)
                    .findOne({ theatre: ObjectId(theatreId), api_movie_id: movieData.api_movie_id })
                    .then((MovieCheck) => {
                        if (MovieCheck) {
                            return resolve({ status: false, errorMsg: 'Movie already assigned' })
                        } else {
                            if (MovieExist) {
                                movieData.movie = ObjectId(MovieExist._id)
                                movieData.movie_title = movieFromAPI.original_title

                                db.get().collection(collection.MOVIE_THEATRE_COLLECTION).insertOne(movieData).then((data) => {
                                    resolve({ status: true, screenId: data.insertedId })
                                })

                            } else {
                                movieFromAPI.api_movie_id = movieData.api_movie_id
                                let release_date_arr = movieFromAPI.release_date.split('-');
                                movieFromAPI.release_date_int = parseInt(
                                    release_date_arr[0] + '' + 
                                    release_date_arr[1] + '' + 
                                    release_date_arr[2]
                                );
                                db.get().collection(collection.MOVIE_COLLECTION).insertOne(movieFromAPI).then((data) => {
                                    movieData.movie = data.insertedId;
                                    movieData.movie_title = movieFromAPI.original_title

                                    db.get().collection(collection.MOVIE_THEATRE_COLLECTION).insertOne(movieData).then((data) => {
                                        resolve({ status: true, screenId: data.insertedId })
                                    })

                                })
                            }
                        }
                    })

            })
        })
    },
    getMovieInfo: (mappingId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.MOVIE_COLLECTION)
                .findOne({ _id: ObjectId(mappingId) }).then((movie) => {
                    if (movie) {
                        return resolve({ status: true, movie: movie })
                    } else {
                        return resolve({ status: false });
                    }
                })
        });
    },
    disableMovie: (movieId) => {
        return new Promise(async (resolve, reject) => {
            var movie = await db.get().collection(collection.MOVIE_THEATRE_COLLECTION).findOne(
                { _id: ObjectId(movieId) })
            if (movie) {
                await db.get().collection(collection.MOVIE_THEATRE_COLLECTION).updateOne(
                    { _id: ObjectId(movieId) }, { $set: { isEnabled: false, updatedAt: new Date() } }).then(async () => {
                        await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).updateMany(
                            { movie: ObjectId(movieId) }, { $set: { isEnabled: false, updatedAt: new Date() } })
                    })
                return resolve({ status: true })
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    enableMovie: (movieId) => {
        return new Promise(async (resolve, reject) => {
            var movie = await db.get().collection(collection.MOVIE_THEATRE_COLLECTION).findOne(
                { _id: ObjectId(movieId) })
            if (movie) {
                let movieMap = await db.get().collection(collection.MOVIE_COLLECTION).findOne({ _id: ObjectId(movie.movie) });
                if (movieMap) {
                    if (movieMap.api_movie_id == '0'){
                        if (!movieMap.imageUploaded){
                            return resolve({ status: false, errorMsg: "Movie Poster not found" })
                        }

                        if (!movieMap.backdropUploaded){
                            return resolve({ status: false, errorMsg: "Movie Backdrop not found" })
                        }
                    }

                    const data = await db.get().collection(collection.MOVIE_THEATRE_COLLECTION).findOneAndUpdate(
                        { _id: ObjectId(movieId) }, { $set: { isEnabled: true, updatedAt: new Date() } }, { returnNewDocument: true })
                    return resolve({ status: true, data: data.value })
                } else {
                    return resolve({ status: false, errorMsg: "No records found" })
                }
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    getMappingsByTheatre: (theatreId) => {
        return new Promise(async (resolve, reject) => {
            var movieMappings = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate(
                [
                    { $match: { theatre: ObjectId(theatreId) } },
                    {
                        $lookup: {
                            from: collection.SCREEN_COLLECTION,
                            localField: 'screen',
                            foreignField: '_id',
                            as: 'screen_arr'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.MOVIE_THEATRE_COLLECTION,
                            localField: 'movie',
                            foreignField: '_id',
                            as: 'movie_arr'
                        }
                    }
                ]
            ).toArray()
            resolve(movieMappings)
        })
    },
    doAddMapping: (theatreId, mapData) => {
        mapData.createdAt = new Date();
        mapData.theatre = ObjectId(theatreId);
        mapData.isEnabled = true;
        mapData.screen = ObjectId(mapData.screen);
        mapData.movie = ObjectId(mapData.movie);

        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.MOVIE_SCREEN_COLLECTION).insertOne(mapData).then((data) => {
                resolve({ status: true, mapId: data.insertedId })
            })
        })
    },
    doUpdateMapping: (theatreId, mappingId, updateData) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.MOVIE_SCREEN_COLLECTION).findOne({ _id: ObjectId(mappingId) }).then((updated) => {
                updateData.updatedAt = new Date();
                updateData.theatre = ObjectId(theatreId);
                updateData.screen = ObjectId(updateData.screen);
                updateData.movie = ObjectId(updateData.movie);
                db.get().collection(collection.MOVIE_SCREEN_COLLECTION).updateOne({ _id: ObjectId(mappingId) }, { $set: updateData }).then((data) => {
                    resolve({ status: true })
                })
            })
        })
    },
    disableMap: (mapId) => {
        return new Promise(async (resolve, reject) => {
            var mapping = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).findOne(
                { _id: ObjectId(mapId) })
            if (mapping) {
                await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).updateOne(
                    { _id: ObjectId(mapId) }, { $set: { isEnabled: false, updatedAt: new Date() } })
                return resolve({ status: true })
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    enableMap: (mapId) => {
        return new Promise(async (resolve, reject) => {
            var mapping = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).findOne(
                { _id: ObjectId(mapId) })
            if (mapping) {
                var formData = mapping;
                await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).find(
                    {
                        _id: { $ne: ObjectId(formData._id) },
                        theatre: ObjectId(formData.theatre),
                        screen: ObjectId(formData.screen),
                        isEnabled: true,
                        $and:[
                            {
                                $or: [
                                    {
                                        $and: [
                                            { start_time_int: { $lte: formData.start_time_int } },
                                            { end_time_int: { $gte: formData.start_time_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_time_int: { $lte: formData.end_time_int } },
                                            { end_time_int: { $gte: formData.end_time_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_time_int: { $gte: formData.start_time_int } },
                                            { end_time_int: { $lte: formData.end_time_int } }
                                        ]
                                    }
                                ],
                            },
                            {
                                $or: [
                                    {
                                        $and: [
                                            { start_date_int: { $lte: formData.start_date_int } },
                                            { end_date_int: { $gte: formData.start_date_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_date_int: { $lte: formData.end_date_int } },
                                            { end_date_int: { $gte: formData.end_date_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_date_int: { $gte: formData.start_date_int } },
                                            { end_date_int: { $lte: formData.end_date_int } }
                                        ]
                                    }
                                ],
                            }
                        ]
                    }).toArray().then(async (ScreenCheck) => {
                        if (ScreenCheck.length > 0) {
                            return resolve({ status: false, errorMsg: 'Screen not availble at given time slot.' })
                        } else {
                            const data = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).findOneAndUpdate(
                                { _id: ObjectId(mapId) }, { $set: { isEnabled: true, updatedAt: new Date() } }, { returnNewDocument: true })
                            return resolve({ status: true, data: data.value })
                        }
                    });
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    getMapById: (mapId) => {
        return new Promise(async (resolve, reject) => {
            var mapping = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).findOne(
                { _id: ObjectId(mapId) }
            )
            resolve(mapping)
        })
    },
    screenTimeMappingCheck: (formData) => {
        return new Promise(async (resolve, reject) => {

            if (formData.map_id) {
                var existMapping = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).find(
                    {
                        _id: { $ne: ObjectId(formData.map_id) },
                        theatre: ObjectId(formData.owner_id),
                        screen: ObjectId(formData.screen),
                        isEnabled: true,
                        $and:[
                            {
                                $or: [
                                    {
                                        $and: [
                                            { start_time_int: { $lte: formData.start_time_int } },
                                            { end_time_int: { $gte: formData.start_time_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_time_int: { $lte: formData.end_time_int } },
                                            { end_time_int: { $gte: formData.end_time_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_time_int: { $gte: formData.start_time_int } },
                                            { end_time_int: { $lte: formData.end_time_int } }
                                        ]
                                    }
                                ],
                            },
                            {
                                $or: [
                                    {
                                        $and: [
                                            { start_date_int: { $lte: formData.start_date_int } },
                                            { end_date_int: { $gte: formData.start_date_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_date_int: { $lte: formData.end_date_int } },
                                            { end_date_int: { $gte: formData.end_date_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_date_int: { $gte: formData.start_date_int } },
                                            { end_date_int: { $lte: formData.end_date_int } }
                                        ]
                                    }
                                ],
                            }
                        ]
                    }).toArray();
            } else {
                var existMapping = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).find(
                    {
                        theatre: ObjectId(formData.owner_id),
                        screen: ObjectId(formData.screen),
                        isEnabled: true,
                        $and:[
                            {
                                $or: [
                                    {
                                        $and: [
                                            { start_time_int: { $lte: formData.start_time_int } },
                                            { end_time_int: { $gte: formData.start_time_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_time_int: { $lte: formData.end_time_int } },
                                            { end_time_int: { $gte: formData.end_time_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_time_int: { $gte: formData.start_time_int } },
                                            { end_time_int: { $lte: formData.end_time_int } }
                                        ]
                                    }
                                ],
                            },
                            {
                                $or: [
                                    {
                                        $and: [
                                            { start_date_int: { $lte: formData.start_date_int } },
                                            { end_date_int: { $gte: formData.start_date_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_date_int: { $lte: formData.end_date_int } },
                                            { end_date_int: { $gte: formData.end_date_int } }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { start_date_int: { $gte: formData.start_date_int } },
                                            { end_date_int: { $lte: formData.end_date_int } }
                                        ]
                                    }
                                ],
                            }
                        ]
                    }).toArray();
            }

            if (existMapping.length > 0) {
                return resolve(false);
            } else {
                return resolve(true);
            }

        })
    },
    getMovieWiseRevenue : (theatreId, StartDateInt, EndDateInt, currentYear) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                {
                    $match : {
                        isSuccess : true,
                        isPaid : true,
                        $and : [
                            { date_int : { $gte : StartDateInt } },
                            { date_int : { $lte : EndDateInt } }
                        ]
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
                    $match : {
                        'screenDetails.theatre' : ObjectId(theatreId),
                    }
                },
                {
                    $group : {
                        _id : '$movieId',
                        totalRevenue : { $sum : '$totalAmount' }
                    }
                },
                {
                    $lookup :{
                        from : collection.MOVIE_COLLECTION,
                        localField : '_id',
                        foreignField : '_id',
                        as : 'movieDetails'
                    }
                },
                {
                    $unwind : '$movieDetails'
                },
                {
                    $project : {
                        'movieDetails.title' : 1,
                        totalRevenue : 1
                    }
                }
            ]).toArray().then(async (response) => {
                let yearArray = [];

                for (let i =1; i<=12;i++){

                    let currentMonth = '';
                    if (i<10){
                        currentMonth = '0' + i;
                    }else{
                        currentMonth = i
                    }
                    let monthStartDate = parseInt(currentYear + '' + currentMonth + '01');
                    let monthEndDate = parseInt(currentYear + '' + currentMonth + '31');

                    let monthlyRevenue = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                        {
                            $match : {
                                isSuccess : true,
                                isPaid : true,
                                $and : [
                                    { date_int : { $gte : monthStartDate } },
                                    { date_int : { $lte : monthEndDate } }
                                ]
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
                            $match : {
                                'screenDetails.theatre' : ObjectId(theatreId),
                            }
                        },
                        {
                            $group : {
                                _id : '$screenDetails.theatre',
                                totalRevenue : { $sum : '$totalAmount' }
                            }
                        },
                    ]).toArray()

                    if (monthlyRevenue.length > 0){
                        yearArray.push(monthlyRevenue[0].totalRevenue);
                    }else{
                        yearArray.push(0);
                    }
                }

                await db.get().collection(collection.SCREEN_COLLECTION).find({
                    theatre : ObjectId(theatreId)
                }).toArray().then(async (screens) => {
                    screenRevenue = [];
                    for (let j = 0 ; j< screens.length; j++){
                        let revenue = await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                            {
                                $match : {
                                    isSuccess : true,
                                    isPaid : true,
                                    $and : [
                                        { date_int : { $gte : StartDateInt } },
                                        { date_int : { $lte : EndDateInt } }
                                    ],
                                    screen : ObjectId(screens[j]._id)
                                }
                            },
                            {
                                $group : {
                                    _id : '$screen',
                                    totalRevenue : { $sum : '$totalAmount' }
                                }
                            },
                        ]).toArray();
                        if (revenue.length > 0){
                            screenRevenue.push(revenue[0].totalRevenue)
                        }else{
                            screenRevenue.push(0);
                        }
                    }
                    return resolve({ movies : response, yearArray, screens , screenRevenue})
                })
                    
            })
        })
    },
    getRevenuesByTheatre : (theatreId, reqBody) => {
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
                        $match : {
                            'screenDetails.theatre' : ObjectId(theatreId)
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
                        $match : {
                            'screenDetails.theatre' : ObjectId(theatreId)
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
            }

            return resolve(results)
        })
    },
    getUpcomingShows : (currentDateInt, currentTimeInt, theatreId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                {
                    $match : {
                        theatre : ObjectId(theatreId),
                        start_date_int : { $lte : currentDateInt },
                        end_date_int : { $gte : currentDateInt },
                        start_time_int : { $gte : currentTimeInt }
                    }
                },
                {
                    $lookup : {
                        from : collection.MOVIE_THEATRE_COLLECTION,
                        localField : 'movie',
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
            ]).toArray().then((response) => {
                return resolve(response);
            })
        })
    },
    getUpcomingBookings : (mappingId, dateInt) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BOOKING_COLLECTION).aggregate([
                {
                    $match : {
                        mapping : ObjectId(mappingId),
                        date_int : parseInt(dateInt),
                        isSuccess : true, 
                        isPaid : true
                    }
                },
                {
                    $unwind : '$original_seats'
                }
            ]).toArray().then(async (result) => {
                await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                    {
                        $match : {
                            _id : ObjectId(mappingId)
                        }
                    },
                    {
                        $lookup : {
                            from : collection.SCREEN_COLLECTION,
                            localField : 'screen',
                            foreignField : '_id',
                            as : 'screenDetail'
                        }
                    },
                    {
                        $unwind : '$screenDetail'
                    }
                ]).toArray().then((screens) => {
                    return resolve({ result, screen : screens[0] });
                })
            })
        })
    },
    doOwnerNewMovieAdd : (submitData, theatreId) => {
        return new Promise(async (resolve, reject) => {
            let formData = {};
            formData.budget = parseInt(formData.budget);
            formData.title = submitData.title;
            formData.original_title = submitData.title;
            if (submitData.budget){
                formData.budget = parseInt(submitData.budget);
            }
            formData.genres = submitData['genres[]']
            formData.homepage = submitData.homepage;
            formData.original_language = submitData.original_language
            if (submitData.popularity){
                formData.popularity = parseFloat(submitData.popularity)
            }

            formData.release_date = submitData.release_date.split('/').reverse().join('-')

            if (submitData.revenue){
                formData.revenue = parseInt(submitData.revenue)
            }

            if (submitData.runtime){
                formData.runtime = parseInt(submitData.runtime)
            }
            
            if (submitData.vote_average){
                formData.vote_average = parseFloat(submitData.vote_average)
            }

            if (submitData.vote_count){
                formData.vote_count = parseFloat(submitData.vote_count)
            }

            formData.video = false;
            formData.status = submitData.status
            formData.tagline = submitData.tagline
            formData.overview = submitData.overview
            formData.id = 0;
            formData.api_movie_id = '0';

            if (parseInt(submitData.adult) == 1){
                formData.adult = true
            }else{
                formData.adult = false
            }

            let release_date_arr = formData.release_date.split('-');
            formData.release_date_int = parseInt(
                release_date_arr[0] + '' + 
                release_date_arr[1] + '' + 
                release_date_arr[2]
            );

            await db.get().collection(collection.MOVIE_COLLECTION).insertOne(formData).then(async (data) => {
                let movieMap = {
                    movie : ObjectId(data.insertedId),
                    theatre : ObjectId(theatreId),
                    createdAt : new Date(),
                    movie_title : formData.original_title,
                    api_movie_id : '0'
                }
                await db.get().collection(collection.MOVIE_THEATRE_COLLECTION).insertOne(movieMap).then(() => {
                    return resolve({status : true});
                })

            })
        })
    },
    doMovieImageUpload : (movieId, fileId) => {
        return new Promise(async(resolve, reject) => {
            var movie = await db.get().collection(collection.MOVIE_COLLECTION).findOne(
                { _id :  ObjectId(movieId) } )
            if (movie){
                await db.get().collection(collection.MOVIE_COLLECTION).updateOne(
                    { _id :  ObjectId(movieId) },
                    {
                        $set : { imageUpdatedAt : new Date(), imageUploaded : ObjectId(fileId) },
                        $push: { image_array :  ObjectId(fileId) }
                    }
                )
                return resolve({status : true })
            }else{
                return resolve({ status : false, errorMsg : "No records found" })
            }
        })
    },
    doMovieBackdropUpload : (movieId, fileId) => {
        return new Promise(async(resolve, reject) => {
            var movie = await db.get().collection(collection.MOVIE_COLLECTION).findOne(
                { _id :  ObjectId(movieId) } )
            if (movie){
                await db.get().collection(collection.MOVIE_COLLECTION).updateOne(
                    { _id :  ObjectId(movieId) },
                    {
                        $set : { backdropUpdatedAt : new Date(), backdropUploaded : ObjectId(fileId) },
                        $push: { backdrop_array :  ObjectId(fileId) }
                    }
                )
                return resolve({status : true })
            }else{
                return resolve({ status : false, errorMsg : "No records found" })
            }
        })
    },
}