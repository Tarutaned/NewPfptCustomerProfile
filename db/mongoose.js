// ======================================================
// Mongooose Setup
// ======================================================

const mongoose = require('mongoose')
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const crypto = require('crypto')
// const conn = mongoose.createConnection(connectionURI)
var ObjectId = require('mongodb').ObjectID;

const connectionURI = process.env.MONGO_DB_URL || "mongodb://localhost:27017/NewCustomerProfile"
console.log("[+] Connecting to DB: " + connectionURI)
// bluebird breaks the "version update" functionliay when updating a customer
// mongoose.Promise = require('bluebird')
mongoose.connect(
    connectionURI, 
    { 
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    }).then(
    () => {
        console.log('[+] Database is connected')
    },
    err => {
        console.log('[+] Can not connect to the database' + err)

        app.get('/', (req, res) => {
            res.send("[+] Cannot connect to the database")
        })

    }
)
const db = mongoose.connection
//handling mongo error
db.on("error", console.error.bind(console, "[+] DB Connection Error - "))





module.exports = db