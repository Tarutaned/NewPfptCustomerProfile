require('dotenv').config()
const express = require("express")
const https = require("https")
const fs = require("fs")
const bodyParser = require("body-parser")
const methodOverride = require("method-override")
const expressSanitizer = require("express-sanitizer")
const session = require("express-session")
const favicon = require('serve-favicon')
const MongoStore = require("connect-mongo")(session)
const helmet = require('helmet')
const app = express()
const flash = require('connect-flash')

// ======================================================
// Prod or Dev
// ======================================================
if(process.env.PROD === 'true') {
    console.log("[+] Running a Prod Server !")
}
else {
    console.log("[+] Running a Dev server !")
}

// ======================================================
// Mongoose Config
// ======================================================
const db = require('./db/mongoose.js')

// ======================================================
// Express Configuration 
// ======================================================
app.use(helmet())
app.use(favicon(__dirname + '/public/favicon.ico'))
app.use(express.static(__dirname + "/public/"))
// app.use(express.static("public"))

app.set("view engine", "ejs")

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(expressSanitizer())
app.use(methodOverride("_method"))
app.use(flash())
app.locals = require('./routes/locals.js')
session_secret = process.env.JWT_SECRET || "6cxfWPptu8JJ31hv5v9IyE8LIYKMN837XW0FdsUvFaXTO4kc8mfD1BfwusiG"
app.use(function (req, res, next) {
    // Disables back button from showing contents when logged out.
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0')
    next()
})

// Setup express-session
app.use(session({
    store: new MongoStore({ mongooseConnection: db }),
    secret: session_secret,
    ttl: (120),
    cookie: { maxAge: 3600000 },  // 1 hour in Milliseconds
    resave: false,
    saveUninitialized: true
}))

// Setup Passport
const passport = require('passport')
const { env } = require('process')
app.use(passport.initialize())
app.use(passport.session())

// Set Routers
app.use(require("./routes/router"))
app.use(require("./routes/files"))
app.use(require("./routes/api"))
app.use(require("./routes/errorhandlers"))

// Run the app
 var port = process.env.PORT || 80
// app.listen(port, function () {
//     console.log(`[+] Server is listening on port ${port}`)
// })

  

const options = {
    key: fs.readFileSync(__dirname + process.env.HTTPS_KEYFILE),
    cert: fs.readFileSync(__dirname + process.env.HTTPS_CERTFILE),
    passphrase: process.env.HTTPS_PASSPHRASE
}

console.log("[+] Running server on port: " + port)
https.createServer(options, app).listen(port)