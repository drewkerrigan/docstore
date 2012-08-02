
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , format = require('util').format
  , db = require('riak-js').getClient({host: "localhost", port: "8098" });

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/tutorial', routes.tutorial);

// bodyParser in connect 2.x uses node-formidable to parse 
// the multipart form data.
app.use(express.bodyParser())

app.get('/new', function(req, res){
  res.send('<form method="post" enctype="multipart/form-data" action="/testy">'
    + '<p>Title: <input type="text" name="title" /></p>'
    + '<p>Tags: <input type="text" name="tags" /></p>'
    + '<p>Pdf: <input type="file" name="image" /></p>'
    + '<p><input type="submit" value="Upload" /></p>'
    + '</form>');
});

app.post('/new', function(req, res, next){

  fs.readFile(req.files.image.path, function (err, image) {
  	if (err) throw err;
  	db.save('documents', req.body.title, image, { contentType: 'application/pdf' });
  	db.save('documents_meta', req.body.title, {"name":req.body.title,"tags":req.body.tags,}, { contentType: 'application/json' });
	console.log("Saved pdf in bucket: documents, key: " + req.body.title);
  });

  res.send(format('\nuploaded %s (%d Kb) to %s as %s'
    , req.files.image.name //2012 Payroll and Holiday Calendar_Basho.pdf
    , req.files.image.size / 1024 | 0 //176 Kb
    , req.files.image.path // /tmp/db86f8d5ad9f890ab9d9c7e2f1315064
    , req.body.title)); //Testing
});

app.get('/search', function(req, res){
  res.send('<form method="post" action="/search">'
    + '<p>Query: <input type="text" name="query" /></p>'
    + '<p><input type="submit" value="Upload" /></p>'
    + '</form>');
});

app.post('/search', function(req, res, next){
  db.search('documents_meta', req.body.query, function(err, results) { 
  	console.log(results);
  	ret = "Results:<br />";
  
    if(results.numFound >= 1) {
  	  for (i in results.docs)
	  {
		ret += "<a href='http://localhost:8098/buckets/documents/keys/" + results.docs[i].id + "' >" + results.docs[i].id + "</a><br />";
  	  }
    }
    res.send(ret);
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
