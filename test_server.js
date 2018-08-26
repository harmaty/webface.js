const express = require('express')
const fs      = require('fs');
const app     = express();
app.set('view engine', 'pug')

app.get("/", function (req, res) {
  var file = req.query.file;
  if(file == "")
    file = "webface.test.js";
  else if(file.startsWith("test"))
    file = file.replace("test", "");
  

  fs.readFile(`test/mocha.html`, 'utf8', function(err, contents) {
    res.render(__dirname + "/test/mocha.pug", { file: file });
  });
})

app.get(/.+/, function (req, res) {
  var fn = req.path.substring(1);
  fs.readFile(`test/${req.path}`, 'utf8', function(err, contents) {
    if(fn.endsWith(".js"))
      res.type("application/javascript");
    else
      res.type("text/html");
    res.end(contents);
  });
})

app.listen(8080, () => console.log('Test server for Webface.js running on port 8080.'))
