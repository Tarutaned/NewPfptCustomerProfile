const express = require('express')
const router = new express.Router()
const multer = require('multer')
const mongoose = require('mongoose')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const crypto = require('crypto')
const path = require('path')
var ObjectId = require('mongodb').ObjectID;
const customerfile = require('../models/customerfile')
const Customer = require("../models/customer")
const moment = require('moment')
const connectEnsureLogin      = require('connect-ensure-login')


// ======================================================
// Mongoose Config
// ======================================================
// const conn = require('../db/mongoose.js')

const connectionURI = process.env.MONGO_DB_URL || "mongodb://localhost:27017/NewCustomerProfile"
const conn = mongoose.createConnection(connectionURI, 
  { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})

// Init gfs
let gfs

conn.once('open', () => {
    // Init stream
    gfs = Grid(conn.db, mongoose.mongo)
    gfs.collection('uploads')
})

// Create Storage engine
const storage = new GridFsStorage({
    url: connectionURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const fileInfo = {
            filename: file.originalname,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });




// ======================================================
// API Endpoint
// Upload a file
// ======================================================
router.post('/upload', connectEnsureLogin.ensureLoggedIn(), upload.single('file'), (req, res) => {
  console.log(getTimeStamp() + req.user.sAMAccountName + " uploading file: " + req.file.originalname)
  if (!(req.file === undefined)) {
    const cf = new customerfile( {
      fileID: res.req.file.id,  // FIX THIS !!!?!?!?!
      filename: req.file.originalname,
      customerID: req.body.customername,
      uploadedBy: req.user.sAMAccountName
    })

    cf.save().then( () => {
        req.flash({ "message" : "File Uploaded Successfully" });
        res.redirect("/index/"+req.body.customername)
    }).catch( (e) => {

      if(e.code==11000) {
        return res.render('error.ejs', {message: "Duplicate File Exists", user: req.user})
      }

      console.log(getTimeStamp() + req.user.sAMAccountName + " Something went wrong!!!")
      console.log(e)
      return res.render('error.ejs', {message: e, user: req.user})
    })
    //return res.render('upload.ejs', {success: "File uploaded successfully"})
  } else {
    console.log(getTimeStamp() + req.user.sAMAccountName + '[+] No file was selected.')
    return res.render('upload', {error: "Please select a file"})
  }
})


// ======================================================
// API Endpoint
// Lists all files associated with a customerID
// ======================================================
router.post('/listfiles/:customername', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  customerfile.find({customerID: req.params.customername}).then((list) => {
    return res.send(list)
  }).catch((e) => {
    return res.render('error.ejs', {message: e, user: req.user})
  })
})


// =============================================
// API Endpoint
// Returns a List of Files for a Customer
// =============================================
router.get('/getFiles/:customername', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  customerfile.find({customerID: req.params.customername}).then((result) => {
    if(!result) {
      return res.render('error.ejs', {message: "Nothing found", user: req.user})
    }
    return res.send(result)
    
  }).catch((error) => {
    return res.render('error.ejs', {message: error, user: req.user})
  })
})


// =============================================
// API Endpoint
// Download a file by _id
// =============================================
router.get('/getfile/:_id', (req, res) => {
  console.log(getTimeStamp() + req.user.sAMAccountName + ' downloading file id: ' + req.params._id)
  gfs.files.findOne({_id: ObjectId(req.params._id)}, (err, file) => {
    if(err) {return res.status(500).json( {err})}
    if(!file || file.length === 0) {
      return res.status(404).json(
        { err: 'File does not exist', 
          fileid: req.params._id
      })
    }
    else {
      console.log(Object.keys(file))
      // the file exists
      const readstream = gfs.createReadStream(file);
      res.setHeader("Content-Type", file.contentType)
      res.setHeader("Content-Disposition", "attachment; filename=" + encodeURIComponent(file.filename))
      readstream.pipe(res);
    }
  })
})


// =============================================
// API Endpoint
// Delete One File
// =============================================
router.post('/delete/:id', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  // Delete from "customerfiles" collection, then delete from GridFS
  // Part 1: Delete from "customerfiles"
  customerfile
    .remove({fileID: req.params.id})
    .then(() => {console.log(getTimeStamp() + req.user.sAMAccountName + " Deleted file: " + req.params.id )})
    .catch((error) => {return res.render("error.ejs", {message: error, user: req.user})})

  // Part 2: Delete from Grid FS
  console.log(getTimeStamp() + req.user.sAMAccountName + ' Deleted from GridFS: ' + req.params.id)
  gfs.remove({_id: req.params.id, root: 'uploads'}, (err, gridStore) => {
    if(err) {
      return res.status(404).json({ err: err})
    }
      req.flash('message', 'File Deleted Successfully.')
      return res.redirect('back')
  })
})
  

// =============================================
// Get Timestamp
// =============================================
function getTimeStamp() {
  const date = new Date();
  return '['+ date.getFullYear() + '-' +
      (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
      date.getDate().toString().padStart(2, '0') + ':' +
      date.getHours().toString().padStart(2, '0') + ':' +
      date.getMinutes().toString().padStart(2, '0') + ':' +
      date.getSeconds().toString().padStart(2, '0') + '] ';
}


// =============================================
// Export the User Router
// =============================================
module.exports = router