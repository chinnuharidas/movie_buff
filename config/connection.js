const MondoClient = require('mongodb').MongoClient
const state = {
    db:null
}

module.exports.connect = (callback) => {
    const url = 'mongodb://localhost:27017'
    const dbname = 'movie_ticket_booking'

    MondoClient.connect(url, {useUnifiedTopology: true} ,(err, data) => {
        if (err) {
            return callback(err)
        }
        state.db = data.db(dbname)
        callback()

    })
}

const {GridFsStorage} = require('multer-gridfs-storage');

module.exports.storage = new GridFsStorage({
    url: 'mongodb://localhost:27017/movie_ticket_booking',
    file: (req, file) => {
      return {
        bucketName: 'images',       //Setting collection name, default name is fs
        filename: file.originalname     //Setting file name to original name of file
      }
    }
});

module.exports.get = () => {
    return state.db
}