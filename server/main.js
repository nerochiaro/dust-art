Submissions = new Mongo.Collection("submissons");
Decisions = new Mongo.Collection("decisions");

function toInt(v) { var v = parseFloat(v, 10); return isNaN(v) ? 0 : v }
fieldTypes = {
  'fund_request': toInt,
  'fund_total': toInt
}


// On server startup, create some players if the database is empty.
Meteor.startup(function () {
  var fs = Npm.require("fs");
  function isDir(path) { return fs.existsSync(path) && fs.lstatSync(path).isDirectory() }

  Submissions.remove({});

  var basepath = "/usr/local/www/goingnowhere.org/art/submissions/";
  if (!isDir(basepath)) {
    basepath = process.env.DATA_ROOT;
    if (!isDir(basepath)) {
      console.log("Please set your data directory using the DATA_ROOT env variable.")
      return;
    }
  }

  var submissions = fs.readdirSync(basepath);
  _.each(submissions, function(s) {
    if (isDir(basepath + s)) return;

    var js = JSON.parse(fs.readFileSync(basepath + s));
    var record = {};
    for (var k in js) {
      var key = k.replace(/\-/g, '_')
      var val = fieldTypes[key] ? fieldTypes[key](js[k]) : js[k];
      record[key] = val;
      if (fieldTypes[key] == toInt) console.log(key, record[key], typeof record[key]);
    };
    record._id = s;
    record.timestamp = s.split("_")[0];
    Submissions.insert(record, function(a, b) { console.log(a, b) } );
  });
});
