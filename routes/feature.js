const express                 = require('express')
const router                  = new express.Router()



// ======================================================
// POST Test function
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
// GET Test function
// ======================================================
router.get('/test', (req, res) => {
    console.log('[+] GET /test')
    res.render('test.ejs', {message: "testing"})
    console.log('[+] Response sent')
  })

// =============================================
// Export the User Router
// =============================================
module.exports = router