var db = require('../config/connection')
var collection = require('../config/collections')
const { ObjectId } = require('mongodb');
const { response } = require('express');

module.exports = {
    getDistricts: () => {
        return new Promise((resolve, reject) => {
            var districts = db.get().collection(collection.DISTRICT_COLLECTION).find().toArray()
            resolve(districts)
        })
    },
    getTheatres: (inputStatus) => {
        return new Promise(async (resolve, reject) => {
            if (inputStatus != 'all') {
                var theatres = await db.get().collection(collection.THEATRE_COLLECTION).aggregate([
                    { $match: { status: inputStatus } },
                    {
                        $lookup: {
                            from: collection.DISTRICT_COLLECTION,
                            localField: 'district',
                            foreignField: '_id',
                            as: 'district_arr'
                        }
                    }
                ]).toArray()
            } else {
                var theatres = await db.get().collection(collection.THEATRE_COLLECTION).aggregate([
                    {
                        $lookup: {
                            from: collection.DISTRICT_COLLECTION,
                            localField: 'district',
                            foreignField: '_id',
                            as: 'district_arr'
                        }
                    }
                ]).toArray()
            }


            resolve(theatres)
        })
    },
    doTheatreImageUpload: (theatreId, fileId) => {
        return new Promise(async (resolve, reject) => {
            var theatre = await db.get().collection(collection.THEATRE_COLLECTION).findOne(
                { _id: ObjectId(theatreId) })
            if (theatre) {
                await db.get().collection(collection.THEATRE_COLLECTION).updateOne(
                    { _id: ObjectId(theatreId) },
                    {
                        $set: { imageUpdatedAt: new Date() },
                        $push: { image_array: ObjectId(fileId) }
                    }
                )
                return resolve({ status: true })
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    getTheatresWithMovies: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.THEATRE_COLLECTION).aggregate([
                { $match: { status: "approved" } },
                {
                    $lookup: {
                        from: collection.DISTRICT_COLLECTION,
                        localField: 'district',
                        foreignField: '_id',
                        as: 'district_details'
                    }
                },
                { $unwind: '$district_details' },
                {
                    $lookup: {
                        from: collection.MOVIE_SCREEN_COLLECTION,
                        localField: '_id',
                        foreignField: 'theatre',
                        pipeline: [{ $match: { isEnabled: true } }],
                        as: 'mapping'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        district_details: 1,
                        location: 1,
                        mappingFound: { $gt: [{ $size: "$mapping" }, 0] }
                    }
                },
                { $match: { mappingFound: true } },
                { $sort: { _id: -1 } }
            ]).toArray().then(async (theatres) => {
                return resolve({ status: true, theatres: theatres })
            })
        })
    },
    getTheatreById: (inputId) => {
        return new Promise(async (resolve, reject) => {
            var theatres = await db.get().collection(collection.THEATRE_COLLECTION).aggregate([
                { $match: { _id: ObjectId(inputId) } },
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
                return resolve({ status: false })
            }

            const theatre = theatres[0];
            let imgUrls = [];

            if (theatre.image_array) {
                let img_result = [];
                for (var i = 0; i < theatre.image_array.length; i++) {
                    img_result.push(theatre.image_array[i])
                }
                let docs = await db.get().collection('images.files').find({ _id: { $in: img_result } }).toArray();
                const collectionChunks = db.get().collection('images.chunks');


                for (var j = 0; j < docs.length; j++) {
                    collectionChunks.find({ files_id: docs[j]._id }).sort({ n: 1 }).toArray(function (err, chunks) {
                        let fileData = [];
                        for (let i = 0; i < chunks.length; i++) {
                            fileData.push(chunks[i].data.toString('base64'));
                        }
                        let finalFile = 'data:' + docs[0].contentType + ';base64,' + fileData.join('');
                        imgUrls.push({ imgurl: finalFile })
                    });
                }
            }

            theatre.imgUrls = imgUrls;

            theatre.profilePicUrl = null;
            if (theatre.profilePic) {
                let docs = await db.get().collection('images.files').find({ _id: theatre.profilePic }).toArray();
                const collectionChunks = db.get().collection('images.chunks');

                if (docs[0]) {
                    collectionChunks.find({ files_id: docs[0]._id }).sort({ n: 1 }).toArray(function (err, chunks) {
                        let fileData = [];
                        for (let i = 0; i < chunks.length; i++) {
                            fileData.push(chunks[i].data.toString('base64'));
                        }
                        let finalFile = 'data:' + docs[0].contentType + ';base64,' + fileData.join('');
                        theatre.profilePicUrl = finalFile;
                    });
                }
            }

            return resolve({ status: true, result: theatre })
        })
    },
    doTheatreProfileUpload: (theatreId, fileId) => {
        return new Promise(async (resolve, reject) => {
            var theatre = await db.get().collection(collection.THEATRE_COLLECTION).findOne(
                { _id: ObjectId(theatreId) })
            if (theatre) {
                await db.get().collection(collection.THEATRE_COLLECTION).updateOne(
                    { _id: ObjectId(theatreId) },
                    {
                        $set: { imageUpdatedAt: new Date(), profilePic: ObjectId(fileId) }
                    }
                )

                return resolve({ status: true })
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    doApproveTheatre: (inputId, remarks) => {
        return new Promise(async (resolve, reject) => {
            var theatre = await db.get().collection(collection.THEATRE_COLLECTION).findOne(
                { _id: ObjectId(inputId) })
            if (theatre) {
                await db.get().collection(collection.THEATRE_COLLECTION).updateOne(
                    { _id: ObjectId(inputId) }, { $set: { status: "approved", status_update_remarks: remarks, approvedAt: new Date() } })
                return resolve({ status: true })
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    doRejectTheatre: (inputId, remarks) => {
        return new Promise(async (resolve, reject) => {
            var theatre = await db.get().collection(collection.THEATRE_COLLECTION).findOne(
                { _id: ObjectId(inputId) })
            if (theatre) {
                await db.get().collection(collection.THEATRE_COLLECTION).updateOne(
                    { _id: ObjectId(inputId) }, { $set: { status: "rejected", status_update_remarks: remarks, rejectedAt: new Date() } })
                return resolve({ status: true })
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    getScreensByTheatre: (theatreId) => {
        return new Promise(async (resolve, reject) => {
            var screens = await db.get().collection(collection.SCREEN_COLLECTION).find(
                { theatre: ObjectId(theatreId) }
            ).toArray()
            resolve(screens)
        })
    },
    getEnabledScreensByTheatre: (theatreId) => {
        return new Promise(async (resolve, reject) => {
            var screens = await db.get().collection(collection.SCREEN_COLLECTION).find(
                { theatre: ObjectId(theatreId), isEnabled: true }
            ).toArray()
            resolve(screens)
        })
    },
    getEnabledScreens: () => {
        return new Promise(async (resolve, reject) => {
            var screens = await db.get().collection(collection.SCREEN_COLLECTION).aggregate([
                {
                    $match:
                        { isEnabled: true }
                },
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
                }
            ]).toArray()
            resolve(screens)
        })
    },
    getUsers: () => {
        return new Promise((resolve, reject) => {
            var users = db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    getReviews: () => {
        return new Promise((resolve, reject) => {
            var reviews = db.get().collection(collection.REVIEW_COLLECTION).aggregate([
                {
                    $lookup : {
                        localField : 'user',
                        foreignField : '_id',
                        from : collection.USER_COLLECTION,
                        as : 'userDetails'
                    }
                },
                {
                    $unwind : '$userDetails'
                },
                {
                    $lookup : {
                        localField : 'movie',
                        foreignField : '_id',
                        from : collection.MOVIE_COLLECTION,
                        as : 'movieDetails'
                    }
                },
                {
                    $unwind : '$movieDetails'
                }
            ]).toArray()
            resolve(reviews)
        })
    },
    getUserById: (inputId) => {
        return new Promise(async (resolve, reject) => {
            var users = await db.get().collection(collection.USER_COLLECTION).find({ _id: ObjectId(inputId) }).toArray();

            if (!users || !users[0]) {
                return resolve({ status: false })
            }

            const user = users[0];

            return resolve({ status: true, result: user })
        })
    },
    doEnableUser: (inputId, remarks) => {
        return new Promise(async (resolve, reject) => {
            var user = await db.get().collection(collection.USER_COLLECTION).findOne(
                { _id: ObjectId(inputId) })
            if (user) {
                await db.get().collection(collection.USER_COLLECTION).updateOne(
                    { _id: ObjectId(inputId) }, { $set: { isEnabled: true, status_update_remarks: remarks, enabledAt: new Date() } })
                return resolve({ status: true })
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    doDisableUser: (inputId, remarks) => {
        return new Promise(async (resolve, reject) => {
            var user = await db.get().collection(collection.USER_COLLECTION).findOne(
                { _id: ObjectId(inputId) })
            if (user) {
                await db.get().collection(collection.USER_COLLECTION).updateOne(
                    { _id: ObjectId(inputId) }, { $set: { isEnabled: false, status_update_remarks: remarks, disabledAt: new Date() } })
                return resolve({ status: true })
            } else {
                return resolve({ status: false, errorMsg: "No records found" })
            }
        })
    },
    getMoviesWithTheatres: (dateInt) => {
        return new Promise(async (resolve, reject) => {
            var movies = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                {
                    $match: {
                        isEnabled: true,
                        $and: [
                            { start_date_int: { $lte: dateInt } },
                            { end_date_int: { $gte: dateInt } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: collection.MOVIE_THEATRE_COLLECTION,
                        localField: 'movie',
                        foreignField: '_id',
                        as: 'movieTheatreMap'
                    }
                },
                {
                    $unwind: '$movieTheatreMap'
                },
                {
                    $group: {
                        _id: '$movieTheatreMap.movie'
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
                    $sort: {
                        'movieDetails._id': -1
                    }
                }
            ]).toArray();

            for (var i = 0; i < movies.length; i++) {
                if (movies[i].movieDetails.api_movie_id == '0') {
                    movie = movies[i].movieDetails;
                    let posterDocs = await db.get().collection('images.files').findOne({ _id: ObjectId(movie.imageUploaded) });
                    const posterChunks = await db.get().collection('images.chunks').find({ files_id: ObjectId(movie.imageUploaded) }).sort({ n: 1 }).toArray();
                    let posterFileData = [];
                    for (let i = 0; i < posterChunks.length; i++) {
                        posterFileData.push(posterChunks[i].data.toString('base64'));
                    }
                    let posterFinalFile = 'data:' + posterDocs.contentType + ';base64,' + posterFileData.join('');
                    movies[i].posterFinalFile = posterFinalFile;


                    // let backdropDocs = await db.get().collection('images.files').findOne({ _id : ObjectId(movie.backdropUploaded) });
                    // const backdropChunks = await db.get().collection('images.chunks').find({ files_id: ObjectId(movie.backdropUploaded) }).sort({ n: 1 }).toArray();
                    // let backdropFileData = [];
                    // for (let i = 0; i < backdropChunks.length; i++) {
                    //     backdropFileData.push(backdropChunks[i].data.toString('base64'));
                    // }
                    // let backdropFinalFile = 'data:' + backdropDocs.contentType + ';base64,' + backdropFileData.join('');
                    // movies[i].backdropFinalFile = backdropFinalFile;
                }
            }
            return resolve(movies);
        })
    },
    getUpcomingMovies: (dateInt) => {
        return new Promise(async (resolve, reject) => {
            var movies = await db.get().collection(collection.MOVIE_COLLECTION).aggregate([
                {
                    $match: {
                        release_date_int: { $gt: dateInt }
                    }
                },
                {
                    $sort: {
                        '_id': -1
                    }
                }
            ]).toArray();

            for (var i = 0; i < movies.length; i++) {
                if (movies[i].api_movie_id == '0') {
                    movie = movies[i];
                    let posterDocs = await db.get().collection('images.files').findOne({ _id: ObjectId(movie.imageUploaded) });
                    const posterChunks = await db.get().collection('images.chunks').find({ files_id: ObjectId(movie.imageUploaded) }).sort({ n: 1 }).toArray();
                    let posterFileData = [];
                    for (let i = 0; i < posterChunks.length; i++) {
                        posterFileData.push(posterChunks[i].data.toString('base64'));
                    }
                    let posterFinalFile = 'data:' + posterDocs.contentType + ';base64,' + posterFileData.join('');
                    movies[i].posterFinalFile = posterFinalFile;
                }
            }
            return resolve(movies);
        })
    },
    getMovieGenres: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.GENRE_COLLECTION).find().toArray().then((results) => {
                return resolve(results);
            })
        })
    },
    getMovieLanguages: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.LANGUAGE_COLLECTION).find().toArray().then((results) => {
                return resolve(results);
            })
        })
    },
    getMovieUploadedImage: (movieId) => {
        return new Promise(async (resolve, reject) => {
            let image;
            await db.get().collection(collection.MOVIE_COLLECTION).findOne({ _id: ObjectId(movieId) }).then(async (movie) => {
                const docs = await db.get().collection('images.files').findOne({ _id: ObjectId(movie.imageUploaded) });
                const chunks = await db.get().collection('images.chunks').find({ files_id: ObjectId(movie.imageUploaded) }).sort({ n: 1 }).toArray();
                let fileData = [];
                for (let i = 0; i < chunks.length; i++) {
                    fileData.push(chunks[i].data.toString('base64'));
                }
                let finalFile = 'data:' + docs.contentType + ';base64,' + fileData.join('');
                image = finalFile;
            })
            return resolve(image);
        });
    },
    getMovieUploadedBackdrop: (movieId) => {
        return new Promise(async (resolve, reject) => {
            let image;
            await db.get().collection(collection.MOVIE_COLLECTION).findOne({ _id: ObjectId(movieId) }).then(async (movie) => {
                const docs = await db.get().collection('images.files').findOne({ _id: ObjectId(movie.backdropUploaded) });
                const chunks = await db.get().collection('images.chunks').find({ files_id: ObjectId(movie.backdropUploaded) }).sort({ n: 1 }).toArray();
                let fileData = [];
                for (let i = 0; i < chunks.length; i++) {
                    fileData.push(chunks[i].data.toString('base64'));
                }
                let finalFile = 'data:' + docs.contentType + ';base64,' + fileData.join('');
                image = finalFile;
            })
            return resolve(image);
        });
    },
    getLanguageNameByCode: (language_code) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.LANGUAGE_COLLECTION).findOne({ iso_639_1: language_code }).then((language) => {
                return resolve(language.english_name)
            })
        })
    },
    getActiveMovieLanguages: (currentDate) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                {
                    $match: {
                        $and: [
                            { start_date_int: { $lte: currentDate } },
                            { end_date_int: { $gte: currentDate } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: collection.MOVIE_THEATRE_COLLECTION,
                        localField: 'movie',
                        foreignField: '_id',
                        as: 'theatreMapping'
                    }
                },
                {
                    $unwind: '$theatreMapping'
                },
                {
                    $lookup: {
                        from: collection.MOVIE_COLLECTION,
                        localField: 'theatreMapping.movie',
                        foreignField: '_id',
                        as: 'movieDetails'
                    }
                },
                {
                    $unwind: '$movieDetails'
                },
                {
                    $match: {
                        'movieDetails.api_movie_id': { $ne: '0' }
                    }
                },
                {
                    $lookup: {
                        from: collection.LANGUAGE_COLLECTION,
                        localField: 'movieDetails.original_language',
                        foreignField: 'iso_639_1',
                        as: 'languageDetails'
                    }
                },
                {
                    $unwind: '$languageDetails'
                },
                {
                    $group: { _id: { language: '$languageDetails.english_name', code: '$movieDetails.original_language' } }
                }
            ]).toArray().then(async (movieDbLanguages) => {

                let addedLanguages = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                    {
                        $match: {
                            $and: [
                                { start_date_int: { $lte: currentDate } },
                                { end_date_int: { $gte: currentDate } }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: collection.MOVIE_THEATRE_COLLECTION,
                            localField: 'movie',
                            foreignField: '_id',
                            as: 'theatreMapping'
                        }
                    },
                    {
                        $unwind: '$theatreMapping'
                    },
                    {
                        $lookup: {
                            from: collection.MOVIE_COLLECTION,
                            localField: 'theatreMapping.movie',
                            foreignField: '_id',
                            as: 'movieDetails'
                        }
                    },
                    {
                        $unwind: '$movieDetails'
                    },
                    {
                        $match: {
                            'movieDetails.api_movie_id': { $eq: '0' }
                        }
                    },
                    {
                        $group: { _id: '$movieDetails.original_language' }
                    }
                ]).toArray();

                return resolve({ movieDbLanguages, addedLanguages });
            })
        })
    },
    getMoviesWithFilters: (dateInt, languageArray, genreArray, search_movie) => {

        if (languageArray == undefined){
            languageArray = [];
        }

        if (genreArray == undefined){
            genreArray = []
        }

        if (!Array.isArray(languageArray)) {
            languageArray = [languageArray];
        }

        if (!Array.isArray(genreArray)) {
            genreArray = [genreArray];
        }

        let genreFilter = [];
        for (var i = 0; i < genreArray.length; i++) {
            genreFilter.push(
                { 'movieDetails.genres.name': genreArray[i] }
            );
            genreFilter.push(
                { 'movieDetails.genres': genreArray[i] }
            );
        }

        let movieSearchByName = {};

        if (search_movie != undefined && search_movie != '' && search_movie != null){
            movieSearchByName = { 
                'movieDetails.title' : {'$regex' : search_movie, '$options' : 'i'} 
            }
        }

        return new Promise(async (resolve, reject) => {
            var movies = [];
            if (languageArray.length > 0 && genreArray.length > 0) {
                movies = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                    {
                        $match: {
                            isEnabled: true,
                            $and: [
                                { start_date_int: { $lte: dateInt } },
                                { end_date_int: { $gte: dateInt } }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: collection.MOVIE_THEATRE_COLLECTION,
                            localField: 'movie',
                            foreignField: '_id',
                            as: 'movieTheatreMap'
                        }
                    },
                    {
                        $unwind: '$movieTheatreMap'
                    },
                    {
                        $group: {
                            _id: '$movieTheatreMap.movie'
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
                        $sort: {
                            'movieDetails._id': -1
                        }
                    },
                    {
                        $match: {
                            $or: genreFilter
                        }
                    },
                    {
                        $lookup: {
                            from: collection.LANGUAGE_COLLECTION,
                            localField: 'movieDetails.original_language',
                            foreignField: 'iso_639_1',
                            as: 'languageDetails'
                        }
                    },
                    {
                        $match: {
                            $or: [
                                { 'movieDetails.original_language': { $in: languageArray } },
                                { 'languageDetails.english_name': { $in: languageArray } }
                            ]
                        }
                    },
                    {
                        $match : movieSearchByName
                    }
                ]).toArray();
            } else if (languageArray.length > 0) {
                movies = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                    {
                        $match: {
                            isEnabled: true,
                            $and: [
                                { start_date_int: { $lte: dateInt } },
                                { end_date_int: { $gte: dateInt } }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: collection.MOVIE_THEATRE_COLLECTION,
                            localField: 'movie',
                            foreignField: '_id',
                            as: 'movieTheatreMap'
                        }
                    },
                    {
                        $unwind: '$movieTheatreMap'
                    },
                    {
                        $group: {
                            _id: '$movieTheatreMap.movie'
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
                        $sort: {
                            'movieDetails._id': -1
                        }
                    },
                    {
                        $lookup: {
                            from: collection.LANGUAGE_COLLECTION,
                            localField: 'movieDetails.original_language',
                            foreignField: 'iso_639_1',
                            as: 'languageDetails'
                        }
                    },
                    {
                        $match: {
                            $or: [
                                { 'movieDetails.original_language': { $in: languageArray } },
                                { 'languageDetails.english_name': { $in: languageArray } }
                            ]
                        }
                    },
                    {
                        $match : movieSearchByName
                    }
                ]).toArray();
            } else if (genreArray.length > 0) {
                movies = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                    {
                        $match: {
                            isEnabled: true,
                            $and: [
                                { start_date_int: { $lte: dateInt } },
                                { end_date_int: { $gte: dateInt } }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: collection.MOVIE_THEATRE_COLLECTION,
                            localField: 'movie',
                            foreignField: '_id',
                            as: 'movieTheatreMap'
                        }
                    },
                    {
                        $unwind: '$movieTheatreMap'
                    },
                    {
                        $group: {
                            _id: '$movieTheatreMap.movie'
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
                        $sort: {
                            'movieDetails._id': -1
                        }
                    },
                    {
                        $match: {
                            $or: genreFilter
                        }
                    },
                    {
                        $lookup: {
                            from: collection.LANGUAGE_COLLECTION,
                            localField: 'movieDetails.original_language',
                            foreignField: 'iso_639_1',
                            as: 'languageDetails'
                        }
                    },
                    {
                        $match : movieSearchByName
                    }
                ]).toArray();
            } else {
                movies = await db.get().collection(collection.MOVIE_SCREEN_COLLECTION).aggregate([
                    {
                        $match: {
                            isEnabled: true,
                            $and: [
                                { start_date_int: { $lte: dateInt } },
                                { end_date_int: { $gte: dateInt } }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: collection.MOVIE_THEATRE_COLLECTION,
                            localField: 'movie',
                            foreignField: '_id',
                            as: 'movieTheatreMap'
                        }
                    },
                    {
                        $unwind: '$movieTheatreMap'
                    },
                    {
                        $group: {
                            _id: '$movieTheatreMap.movie'
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
                        $sort: {
                            'movieDetails._id': -1
                        }
                    },
                    {
                        $lookup: {
                            from: collection.LANGUAGE_COLLECTION,
                            localField: 'movieDetails.original_language',
                            foreignField: 'iso_639_1',
                            as: 'languageDetails'
                        }
                    },
                    {
                        $match : movieSearchByName
                    }
                ]).toArray();
            }

            for (var i = 0; i < movies.length; i++) {
                if (movies[i].movieDetails.api_movie_id == '0') {
                    movie = movies[i].movieDetails;
                    let posterDocs = await db.get().collection('images.files').findOne({ _id: ObjectId(movie.imageUploaded) });
                    const posterChunks = await db.get().collection('images.chunks').find({ files_id: ObjectId(movie.imageUploaded) }).sort({ n: 1 }).toArray();
                    let posterFileData = [];
                    for (let i = 0; i < posterChunks.length; i++) {
                        posterFileData.push(posterChunks[i].data.toString('base64'));
                    }
                    let posterFinalFile = 'data:' + posterDocs.contentType + ';base64,' + posterFileData.join('');
                    movies[i].posterFinalFile = posterFinalFile;
                }
            }
            return resolve(movies);
        })
    },
    updateMovieVideo : (movieId, video) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.MOVIE_COLLECTION).updateOne({ _id : ObjectId(movieId) }, {
                $set : {
                    trailer : video
                }
            }).then(() => {
                return resolve()
            })
        })
    },
    getMovieReviews : (movieId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.REVIEW_COLLECTION)
            .aggregate([
                {
                    $match :
                    {
                        movie : ObjectId(movieId),
                        isActive : true 
                    }
                },
                {
                    $lookup : {
                        from : collection.USER_COLLECTION,
                        localField : 'user',
                        foreignField : '_id',
                        as : 'userDetails'
                    }
                },
                {
                    $unwind : '$userDetails'
                }
            ]).toArray()
            .then((results) => {
                return resolve(results);
            })
        })
    }
}