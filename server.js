"use strict";

const express = require("express");
const mongo = require("mongodb");
const mongoose = require("mongoose");
require("dotenv").config();
const Url = require("./models/url");
const cors = require("cors");
const dns = require("dns");
const shortid = require("shortid");
const { error } = require("console");

const app = express();

// Basic Configuration
const port = process.env.PORT || 3002;

/** this project needs a db !! **/

mongoose.connect(
  process.env.DB_URI,
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
  (error) => {
    if (error) {
      console.log("Error connecting to mongo atlas", error);
    } else {
      console.log("Connected to mongo atlas successfully...");
    }
  }
);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/public", express.static(process.cwd() + "/public"));


app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.post("/api/shorturl/new", async function (req, res, next) {
  dns.lookup(req.body.url, async (error, address, family) => {
    if (error) {
      res.json({ error: "invalid url" });
    } else {
      await Url.create(
        { original_url: req.body.url, short_url: shortid.generate() },
        (error, data) => {
          if (error) {
            console.log("Error creating document", error);
          } else {
            const url_shortened = {
              original_url: data.original_url,
              short_url: data.short_url,
            };
            res.json(url_shortened);
            next();
          }
        }
      );
    }
  });
});

app.get("/api/shorturl/new/:shortUrl", async function (req, res) {
  var shortUrlCode = req.params.shortUrl;
  await Url.findOne({ short_url: shortUrlCode }, (error, data) => {
    if (error) {
      console.log("Error finding url");
    }else{
      if (!data) {
        return res
        .status(400)
        .json("The short url doesn't exists in our system.");
        
    } else {
      return res.redirect("https://" + data.original_url)
    }
    }
  })
});

app.listen(port, () => {
  console.log(`Server running on localhost:${port}`);
});
