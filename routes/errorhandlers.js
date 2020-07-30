// This is an error handler for Express itself.
// If an express error happens, then this code will run

const express = require("express");
const router = new express.Router()

//catch 404 and forward to error handler
router.use(function () {
    var err = new Error("[+] File Not Found")
    err.status = 404
})

//error handler
//defined as the last app.use callback
router.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(err.status || 500)
    res.send(err.message)
})


// =============================================
// Export the router
// =============================================
module.exports = router