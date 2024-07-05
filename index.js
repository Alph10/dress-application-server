const express = require("express");
const { brands } = require("./scrapeLogic");
const app = express();

const PORT = process.env.PORT || 4000;

// app.get("/search", (req, res) => {
//   search(req, res);
// });

app.get("/brands", (req, res) => {
  brands(req, res);
});

// app.get("/scrape", (req, res) => {
//   scrapeLogic(req, res);
// });

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
