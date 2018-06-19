var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

app.get("/",function (req, res){
    res.send("Deployed!");
});

// app.get("/webhook", function (req, res){
//     if (req.query["hub.verify_token"] === "this_is_my_token"){
//         console.log("確認 web hook");
//         res.status(200).send(req.query["hub.challenge"]);
//     }else{
//         console.error("認證失敗，tokens不對");
//         res.sendStatus(403);
//     }

// });