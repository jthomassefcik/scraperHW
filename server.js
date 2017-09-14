var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
var request = require("request");
var cheerio = require("cheerio");

mongoose.Promise = Promise;



var app = express();


app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));


app.use(express.static("public"));


mongoose.connect("mongodb://localhost/scraperHW");
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});



app.get("/scrape", function(req, res) {
  request("https://thoughteconomics.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    
    
    $("article h2").each(function(i, element) {

      
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      
      var entry = new Article(result);

      
      entry.save(function(err, doc) {

        if (err) {
          console.log(err);
        }
        else {
          console.log(doc);
        }
      });

    });
  });
  // Tell the browser that we finished scraping the text
  res.send("Scrape Complete");
});


app.get('/all', function(req,res){
  Article.find({}, function(err, doc) {
    if (err) {
      console.log(err);
    }
    else {
      res.json(doc);
    }
    
  })
})

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
      res.json(doc);
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  .populate("note")
  .exec(function(error, doc) {
      res.json(doc);
  });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, note) {
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": note._id })
      .exec(function(err, article) {
          res.send(article);
      });
  });
});


// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
