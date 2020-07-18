require('dotenv').config()
const express = require("express")
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
app.set("view engine", "ejs")
app.use(express.static(__dirname + "/public"))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressSanitizer())
app.use(methodOverride("_method"))
app.locals = require('./routes/locals.js')
app.use(function (req, res, next) {
    // Disables back button from showing contents when logged out.
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0')
    next()
})

// Setup express-session
app.use(session({
    store: new MongoStore({ mongooseConnection: db }),
    secret: 'supersecretcode',
    ttl: (120),
    cookie: { maxAge: 3600000 },  // 1 hour in Milliseconds
    resave: false,
    saveUninitialized: true
}))

app.use(flash())

// Setup Passport
const passport = require('passport')
app.use(passport.initialize())
app.use(passport.session())

// Set Routers
app.use(require("./routes/router"))

app.use(require("./routes/api"))
app.use(require("./routes/errorhandlers"))

// Run the app
var port = process.env.PORT || 80
app.listen(port, function () {
    console.log(`[+] Server is listening on port ${port}`)
})