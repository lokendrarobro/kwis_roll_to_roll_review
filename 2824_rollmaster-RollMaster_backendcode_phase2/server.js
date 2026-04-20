var express = require("express")
const cors = require('cors'); 
const apiRouter = require('./routes/apiRoute.js');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');


var app = express()

//for cors problem
app.use(cors());

//for extract json in request body
// app.use(express.json());

//for extract request body values in post method
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));


//var db = require("../connection/dbConnection.js");
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res, next) => {
    res.json({"message":"Ok"})
});

app.use('/uploads', express.static('uploads'));
//base url 
app.use('/api',apiRouter);

app.get('/api/',(req,res,next) => {
    res.json({
        "status":true,
        "message":"API works"
    })
});
// Server port
const HTTP_PORT = parseInt(process.env.SERVER_PORT, 10) || 8889;
const HTTP_IP = process.env.SERVER_IP || "0.0.0.0"; // fallback to 0.0.0.0 if not provided

app.listen(HTTP_PORT,HTTP_IP,() => {
    console.log(`Server running on http://${HTTP_IP}:${HTTP_PORT}`)
});
// Root endpoint


// Default response for any other request
app.use(function(req, res){
    res.json({
        "status":false,
        "message": "Page not found"
      })
});
