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
const conn = mongoose.createConnection(connectionURI)

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




// @route POST /upload
// @desc Uploads file to DB
router.post('/upload', connectEnsureLogin.ensureLoggedIn(), upload.single('file'), (req, res) => {
  console.log('[+] Post upload: ' + req.file.originalname)
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

      console.log("[-] Something went wrong!!!")
      console.log(e)
      return res.render('error.ejs', {message: e, user: req.user})
    })
    //return res.render('upload.ejs', {success: "File uploaded successfully"})
  } else {
    console.log('[+] No file was selected.')
    return res.render('upload', {error: "Please select a file"})
  }
})



// ======================================================
// Test function
// ======================================================
router.post('/test', (req, res) => {
  console.log('[+] Test Function')
  console.log(Object.keys(req.body))
  // console.log(res.req.file.id)
  // console.log(req.file.originalname)
  
  console.log('[+] CustomerName: ' + req.customername)
  console.log('[+] Username: ' + req.user.sAMAccountName)
  res.send({"customername":req.customername, "username":req.user.sAMAccountName})
})


// ======================================================
// GET
// Lists all files associated with a customerID
// ======================================================
router.post('/listfiles/:customername', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  customerfile.find({customerID: req.params.customername}).then((list) => {
    return res.send(list)
  }).catch((e) => {
    return res.render('error.ejs', {message: e, user: req.user})
  })
})

router.post('/echo', (req, res) => {
  console.log(req.body)
  const response = req.body.search
  res.send(response)
})

// @route GET /files
// @desc Display all files in JSON
router.get('/files', (req, res) => {
  console.log('[+] Get Files')
  gfs.files.find().toArray( (err, files) => {
    if(err) {
      return res.status(500).json({ err })
    }

    // Check if files exist
    if(!files || files.length === 0) {
      return res.render('files.ejs')
    }
    else {
      // Files exist
      return res.render('files.ejs', {files})
    }
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

// @route GET /files/:filename
// @desc Display one file object in JSON
router.get('/files/:filename', (req, res) => {
  console.log('[+] Get file: ' + req.params.filename)
  gfs.files.findOne({filename: req.params.filename }, (err, file) => {
    if(err) { return res.status(500).json({ err }) }
    if(!file || file.length === 0) {
      return res.status(404).json({ err: 'file does not exist'})
    }
    else {
      // the file exists
      return res.json(file)
    }
   })
})

// @route /GET /image
// @desc Display an image
router.get('/image/:filename', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  console.log('[+] Get image: ' + req.params.filename)
  gfs.files.findOne({filename: req.params.filename}, (err, file) => {
    if(err) { return res.status(500).json({ err }) }
    if(!file || file.length === 0) { 
      return res.status(404).json({ err: 'File does not exist'})
    }
    else {
      // the file exists
      if(file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
        
        // Read output to browser
        const readstream = gfs.createReadStream(file);
        readstream.pipe(res);
        
      }
      else {
        const readstream = gfs.createReadStream(file);
        readstream.pipe(res);
        // return res.status(404).json({ err: 'This file is not an image'})
      }
      
    }
  })
})

// @route /GET /file
// @desc Download a File by ID
router.get('/getfile/:_id', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  console.log('[+] Get file id: ' + req.params._id)
  gfs.files.findOne({_id: ObjectId(req.params._id)}, (err, file) => {
    if(err) {return res.status(500).json( {err})}
    if(!file || file.length === 0) {
      return res.status(404).json(
        { err: 'File does not exist', 
          fileid: req.params._id
      })
    }
    else {
      // the file exists
      const readstream = gfs.createReadStream(file);
      console.log('[+] User is downloading a ' + file.contentType + ' file, named: ' + file.filename)
      // Set the File Type and Filename before sending the stream
      res.writeHead(200, {
        "Content-Type": file.contentType,
        "Content-Disposition": "attachment; filename*=" + encodeURIComponent(file.filename)
      });
      readstream.pipe(res);
    }
  })
})


// =============================================
// API Endpoint
// Delete One File
// =============================================
router.post('/delete/:id', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  console.log('[+] Delete file where id=' + req.params.id)

  // This has 2 parts
  // Part 1 = Delete from the list of files
  // Part 2 = Delete the actual file from the DB using GridFS.remove


  // Delete from the list of files
  customerfile
    .remove({fileID: req.params.id})
    .then(() => {console.log("Deleted file: " + req.params.id )})
    .catch((error) => {return res.render("error.ejs", {message: error, user: req.user})})

  // Delete from Grid FS

  console.log('[+] Delete from GridFS' + req.params.id)
  gfs.remove({_id: req.params.id, root: 'uploads'}, (err, gridStore) => {
    if(err) {
      return res.status(404).json({ err: err})
    }
      req.flash('message', 'File Deleted Successfully.')
      return res.redirect('back')
  })

})
  





// =============================================
// Export the User Router
// =============================================
module.exports = router