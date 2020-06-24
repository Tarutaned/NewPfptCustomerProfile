var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var expressSanitizer = require("express-sanitizer");
var session = require("express-session");
var favicon = require('serve-favicon');
var MongoStore = require("connect-mongo")(session);
var helmet = require('helmet');
var path = require('path');
var app = express();

var crypto = require('crypto');
var multer = require('multer');
var GridFSStorage = require('multer-gridfs-storage');
var gridfs_stream = require('gridfs-stream');

// For authenticating cookies/sessions.
function authenticate_session(req, res, next) {
    var append = '/customerprofile'
    if (req.session.user) {
        next();
    } else {
        res.redirect(append + "/login");
    }
}

//APP CONFIGURATION
app.use(helmet());
app.use(favicon(__dirname + '/public/favicon.ico'));

app.enable('trust proxy');

var databaseUrl = process.env.MONGO_DB_URL || "mongodb://localhost:27017/NewCustomerProfile";
console.log("[+] Connecting to DB: " + databaseUrl)
//mongoose.Promise = require('bluebird');
mongoose.connect(databaseUrl, { useMongoClient: true }).then(
    () => {
        console.log('[+] Database is connected');
    },
    err => {
        console.log('Can not connect to the database' + err);
    }
);

// mongoose.connect(databaseUrl);
var db = mongoose.connection;

//handling mongo error
db.on("error", console.error.bind(console, "[+] DB Connection Error - "));

var gfs;
db.once("open", function () {
    gfs = gridfs_stream(db.db, mongoose.mongo);
    gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFSStorage({
    url: databaseUrl,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    metadata: {
                        customer: (req.body.customername) ? req.body.customername : null,
                        diagram: (req.body.diagram) ? req.body.diagram : null,
                        originalname: (file) ? file.originalname : null
                    },
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2097152 // 2 MB
    }
});

// Setup express-session
app.use(session({
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    secret: 'supersecretcode',
    ttl: (120),
    cookie: { maxAge: 3600000 },  // 1 hour in Milliseconds
    resave: false,
    saveUninitialized: true
}))

// Setup Passport
const passport = require('passport')
app.use(passport.initialize())
app.use(passport.session())

// Used in update
app.locals.make_custom_dropdown = function (name, value, list, classname) {
    if (!classname) {
        classname = '';
    }

    var dropdown = '<select class="form-control ' + classname + '" name="' + name + '">';

    dropdown += '<option value="">No response</option>';

    for (var i = 0; i < list.length; i++) {
        if (value == list[i]) {
            dropdown += '<option value="' + list[i] + '" selected>' + list[i] + '</option>';
        } else {
            dropdown += '<option value="' + list[i] + '">' + list[i] + '</option>';
        }
    }

    dropdown += '</select>';

    return dropdown;
};

// Exposes the username for the header nav bar.
app.use(function expose_username(req, res, next) {
    res.locals.user = req.session.user;
    next();
});

// Disables back button from showing contents when logged out.
app.use(function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

// app.use(function printSession(req, res, next) {
//     console.log('req.session', req.session);
//     next();
// });

// set so we don't have to type .ejs all the time when routing
app.set("view engine", "ejs");
// used so we can make a public folder that contains stylesheet and js, and be able to access it
app.use(express.static(__dirname + "/public"));
// used so we can get data from forms and etc.
app.use(bodyParser.urlencoded({ extended: true }));
// security. This line of code has to be always after body-parser
app.use(expressSanitizer());
// so we can use PUT request
app.use(methodOverride("_method"));

//including routes. Seperating the routes to different file, so it will be cleaner.
var routes = require("./routes/router");
var apiEndpoints = require ("./routes/api")
app.use(routes);
app.use(apiEndpoints)

///////////////////////////////////////////////////////////////////////////////////////////////////////

// @route GET /uploads
// @desc Gets all uploaded files
app.get('/uploads', authenticate_session, (req, res) => {
    gfs.files.find().toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
            res.json([]);
        } else {
            // files.map(file => {
            //     if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            //         file.isImage = true;
            //     } else {
            //         file.isImage = false;
            //     }
            // });
            //console.log(files);
            res.json(files);
        }
    });
});

// @route GET /uploads/:id
// @desc Gets all uploaded files for a given customer
app.get('/uploads/:id', authenticate_session, (req, res) => {
    gfs.files.find({ "metadata.customer": req.params.id }).toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
            res.json([]);
        } else {
            // files.map(file => {
            //     if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            //         file.isImage = true;
            //     } else {
            //         file.isImage = false;
            //     }
            // });
            //console.log(files);
            res.json(files);
        }
    });
});

// @route POST /uploads/:id
// @desc Updates all files for a given customer if they changed their name.
app.post('/uploads/:id', authenticate_session, (req, res) => {
    let updated = { success: true };
    gfs.files.find({ "metadata.customer": req.params.id }).toArray((err, files) => {
        if (req.body && req.body.new_name) {
            files.forEach(file => {
                //console.log(file);
                gfs.files.update({ _id: file._id }, {
                    $set: { "metadata.customer": req.body.new_name }
                }).catch(error => {
                    console.log("Failed changing customer name.");
                    updated.success = false;
                });
            });
        } else {
            console.log("No new customer name to change to.");
            updated.success = false;
            res.status(500).json(updated.toString());
        }
        res.status(200).json(updated);
    });
});


// @route POST /upload
// @desc  Uploads file to DB
app.post('/uploads', authenticate_session, upload.single('file'), (req, res) => {
    res.redirect(req.headers.referer);
});


// @route GET /files
// @desc  Display all files in JSON
app.get('/files', authenticate_session, (req, res) => {
    gfs.files.find().toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
            return res.render('uploads', { files: false });
        }

        // Files exist
        return res.render('uploads', { files: files });
    });
});

// @route GET /files/:filename
// @desc  Downloads the file
app.get('/files/:filename', authenticate_session, (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (err) {
            res.status(404).send("Error in retrieving file.");
        }
        // Check if file
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No such file.'
            });
        }

        // File exists
        //return res.json(file);

        res.setHeader('Content-disposition', 'attachment; filename=' + file.filename);
        res.setHeader('Content-type', file.contentType);

        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
    });
});

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
    console.log('delete reached')
    console.log(`'${req.params.id}'`);
    if (req.body.delete_customer) {
        console.log('Wiping customer ' + req.params.id)
        gfs.files.find({ "metadata.customer": req.params.id }).toArray((err, files) => {
            files.forEach(file => {
                gfs.remove({ _id: file._id, root: 'uploads' }, (err, gridStore) => {
                    if (err) {
                        //console.log(err);
                        return res.status(404).json({ err: err });
                    }
                    //res.redirect('/customerprofile/files/');
                });
            });
            res.status(200).json("{}");
        });
    } else {
        gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
            if (err) {
                //console.log(err);
                return res.status(404).json({ err: err });
            }
            //res.redirect('/customerprofile/files/');
            res.status(200).json("{}");
        });
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////

//catch 404 and forward to error handler
app.use(function () {
    var err = new Error("File Not Found");
    err.status = 404;
});

//error handler
//defined as the last app.use callback
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);
});

var port = process.env.PORT || 80;

app.listen(port, function () {
    console.log(`[+] Server is listening on port ${port}`);
});