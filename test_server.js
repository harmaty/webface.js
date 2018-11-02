const express  = require('express')
var bodyParser = require('body-parser');
const fs       = require('fs');
const app      = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'pug')

app.get("/", function (req, res) {
  var file = req.query.file;
  if(file == "" || file == null)
    file = "webface.test.js";
  else if(file.startsWith("test"))
    file = file.replace("test", "");

  fs.readFile(`test/mocha.html`, 'utf8', function(err, contents) {
    res.render(__dirname + "/test/mocha.pug", { file: file });
  });
})

app.post("/report_error", function (req, res, next) {
  res.type("text/plain");
  res.end("OK");
});

app.post("/ajax_test", function (req, res, next) {
  res.type("application/json");
  res.end(JSON.stringify(req.body));
});

app.get("/ajax_test", function (req, res, next) {
  res.type("application/json");
  res.end(JSON.stringify(req.query));
});

app.get(/.+/, function (req, res) {
  var fn = req.path.substring(1);
  fs.readFile(`test/${req.path}`, 'utf8', function(err, contents) {
    if(fn.endsWith(".js"))
      res.type("application/javascript");
    else if(fn.endsWith(".css"))
      res.type("text/css");
    else
      res.type("text/html");
    res.end(contents);
  });
})

app.listen(8080, () => console.log('Test server for Webface.js running on port 8080.'))
