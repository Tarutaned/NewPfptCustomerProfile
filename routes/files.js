const express = require('express')
const router = new express.Router()
const multer = require('multer')
const mongoose = require('mongoose')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const crypto = require('crypto')
const connectionURI = 'mongodb://127.0.0.1:27017/example'
const conn = mongoose.createConnection(connectionURI)
var ObjectId = require('mongodb').ObjectID;

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


// @route GET /
// @desc Loads form
router.get('/', function (req, res) {
    console.log('[+] Get Upload')
    res.render('upload')
  })


// @route POST /upload
// @desc Uploads file to DB
router.post('/upload', upload.single('file'), (req, res) => {
  // We need:
  // 1 - the file
  // 2 - the customer name
  // 3 - the user name
  console.log('[+] Uploading a file for ' + req.body.customername)
  
  if (!(req.file === undefined)) {
    console.log('[+] Uploaded: ' + req.file.originalname)
    console.log('[+] Type: ' + req.file.mimetype)
    return res.redirect('/index/' + req.body.customername)
  } else {
    console.log('[+] No file was selected.')
    return res.render('error.ejs', {error: "No file was selected."})
  }
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
router.get('/image/:filename', (req, res) => {
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
router.get('/getfile/:_id', (req, res) => {
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
      console.log('[+] User is downloading: ' + file.filename)
      console.log(encodeURIComponent(file.filename))
      // Set the File Type and Filename before sending the stream
      res.writeHead(200, {
        "Content-Type": file.contentType,
        "Content-Disposition": "attachment; filename*=" + encodeURIComponent(file.filename)
      });
      readstream.pipe(res);
    }
  })
})


// @route DELETE /files/:id
// @desc Delete one file that matches the id
router.delete('/files/:id', (req, res) => {
  console.log('[+] Delete file where id=' + req.params.id)
  gfs.remove({_id: req.params.id, root: 'uploads'}, (err, gridStore) => {
    if(err) {
      return res.status(404).json({ err: err})
    }
    res.redirect('/files')
  })
})

// @route GET /files/:id
// @desc Delete one file that matches the id
router.post('/delete/:id', (req, res) => {
  console.log('[+] Delete file where id=' + req.params.id)
  gfs.remove({_id: req.params.id, root: 'uploads'}, (err, gridStore) => {
    if(err) {
      return res.status(404).json({ err: err})
    }
    res.redirect('/files')
  })
})



// =============================================
// Export the User Router
// =============================================
module.exports = router