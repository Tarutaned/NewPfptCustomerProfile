// ======================================================
// Mongo DB
// ======================================================


const mongoose = require('mongoose')

const databaseUrl = process.env.MONGO_DB_URL || "mongodb://localhost:27017/NewCustomerProfile"
console.log("[+] Connecting to DB: " + databaseUrl)
mongoose.Promise = require('bluebird')
mongoose.connect(
    databaseUrl, 
    { 
        useMongoClient: true
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