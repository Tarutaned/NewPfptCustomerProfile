// **************************************************
// /routes/api.js
// Provides routing for API Endpoints
// **************************************************

const express                 = require('express')
const app                     = new express.Router()

// =============================================
// Health Check Endpoint
// =============================================
app.get("/api/health/", (req, res) => {
    // TO DO
    // Check DB Connection before responding
    res.status(200).send("ok")
  })

// =============================================
// Export the router
// =============================================
module.exports = app 