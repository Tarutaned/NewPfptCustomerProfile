// **************************************************
// /routes/api.js
// Provides routing for API Endpoints
// **************************************************

const express = require('express')
const router = new express.Router()

// =============================================
// Health Check Endpoint
// =============================================
router.get("/api/health/", (req, res) => {
    // TO DO
    // Check DB Connection before responding
    res.status(200).send("ok")
  })


router.get('/api/getConnectors/:customerName', (req, res) => {

})

router.post('/api/setConnectors/:customerName', (req, res) => {
  
})





// =============================================
// Export the router
// =============================================
module.exports = router 