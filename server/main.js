Submissions = new Mongo.Collection("submissons");

function toInt(v) { var v = parseFloat(v, 10); return isNaN(v) ? 0 : v }
fieldTypes = {
  'fund_request': toInt,
  'fund_total': toInt
}

// On server startup, create some players if the database is empty.
Meteor.startup(function () {
  Submissions.remove({});

  var fs = Npm.require("fs");
  var basePath = "/home/nerochiaro/projects/nowhere/artforms/artview/server/submissions/";
  var submissions = fs.readdirSync(basePath);
  _.each(submissions, function(s) {
    var js = JSON.parse(fs.readFileSync(basePath + s));
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
