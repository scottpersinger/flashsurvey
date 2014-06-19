var express = require('express')
  , bodyParser = require('body-parser')
  , expressValidator = require('express-validator')
  , passport =    require('passport')
  , config = require('./config')
  , session = require('cookie-session')
  , auth = require('./controllers/auth2')
  , jsondb = config.jsondb


var app = express();
app.use(bodyParser());
app.use(expressValidator());
app.use(session(
    {
        secret: process.env.COOKIE_SECRET || "Superdupersecret"
    }));
app.use(passport.initialize());
app.use(passport.session());



app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.send(500, err.message);
});


app.post('/register', auth.signup);
app.post('/login', auth.login);
app.post('/logout', auth.validateToken, auth.logout);

var api = express.Router();

api.get('/flashsurvey__c', auth.validateToken, function(req, res) {
	//	res.set('Content-Type', 'application/json');
	//	return res.send(JSON.stringify([{"createddate":"2014-06-11T00:10:35.000Z","sfid":"a1fG000000034gZIAQ","name":"Salesforce1 World Tour","_c5_source":null,"lastmodifieddate":"2014-06-11T00:10:35.000Z","isdeleted":false,"id":1}]))
	jsondb.find('flashsurvey__c', function(err, results) {
		res.set('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	});
});
api.get('/flashsurvey__c/:sfid', auth.validateToken, function(req, res) {
	//	res.set('Content-Type', 'application/json');
	//	return res.send(JSON.stringify({"createddate":"2014-06-11T00:10:35.000Z","sfid":"a1fG000000034gZIAQ","name":"Salesforce1 World Tour","_c5_source":null,"lastmodifieddate":"2014-06-11T00:10:35.000Z","isdeleted":false,"id":1}))
	jsondb.find('flashsurvey__c', {sfid:req.params.sfid}, function(err, results) {
		res.set('Content-Type', 'application/json');
		res.send(JSON.stringify(results[0]));
	});
});
api.get('/flashsurveyquestion__c', function(req, res) {
	//	res.set('Content-Type', 'application/json');
	//	return res.send(JSON.stringify([{"order__c":3,"leftimage__c":null,"answertype__c":"Picklist","name":"3","createddate":"2014-06-11T00:13:23.000Z","_c5_source":null,"flashsurvey__c":"a1fG000000034gZIAQ","lastmodifieddate":"2014-06-11T00:13:23.000Z","id":1,"question__c":"What new feature of Salesforce1 are you most excited about?","isdeleted":false,"choices__c":"Offline Support\nEvents\nBetter Performance","sfid":"a1gG00000016grtIAA","createdbyid":"005G0000003sjPkIAI","lastactivitydate":null},{"order__c":1,"leftimage__c":null,"answertype__c":"Boolean","name":"1","createddate":"2014-06-11T00:11:16.000Z","_c5_source":null,"flashsurvey__c":"a1fG000000034gZIAQ","lastmodifieddate":"2014-06-11T00:11:16.000Z","id":2,"question__c":"Are you already a Salesforce developer?","isdeleted":false,"choices__c":null,"sfid":"a1gG00000016grjIAA","createdbyid":"005G0000003sjPkIAI","lastactivitydate":null},
	//		{"order__c":2,"leftimage__c":"<img alt=\"User-added image\" src=\"http://res.cloudinary.com/hzxejch6p/image/upload/c_scale,w_289/v1384960622/push1_mokoya.png\"></img>","answertype__c":"Text","name":"4","createddate":"2014-06-11T00:11:51.000Z","_c5_source":null,"flashsurvey__c":"a1fG000000034gZIAQ","lastmodifieddate":"2014-06-11T00:15:31.000Z","id":4,"question__c":"Enter your opinion:","isdeleted":false,"choices__c":null,"sfid":"a2gG00000016groIAA","createdbyid":"005G0000003sjPkIAI","lastactivitydate":null},
	//		{"order__c":2,"leftimage__c":"<img alt=\"User-added image\" src=\"http://res.cloudinary.com/hzxejch6p/image/upload/c_scale,w_289/v1384960622/push1_mokoya.png\"></img>","answertype__c":"Boolean","name":"2","createddate":"2014-06-11T00:11:51.000Z","_c5_source":null,"flashsurvey__c":"a1fG000000034gZIAQ","lastmodifieddate":"2014-06-11T00:15:31.000Z","id":3,"question__c":"Do you have Salesforce1 installed on your phone?","isdeleted":false,"choices__c":null,"sfid":"a1gG00000016groIAA","createdbyid":"005G0000003sjPkIAI","lastactivitydate":null}
	//		]));
	console.log(req.query);
	jsondb.find('flashsurveyquestion__c', req.query, function(err, results) {
		res.set('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	});
});
api.post('/flashsurveyresponse__c', function(req, res) {
	console.log(req.body);
	jsondb.create('flashsurveyresponse__c', req.body, function(err, result) {
		if (err) {
			console.log(err);
		}
		res.set('Content-Type', 'application/json');
		return res.send(JSON.stringify(result));
	})
});
api.post('/flashquestionresponse__c', function(req, res) {
	console.log(req.body);
	jsondb.create('flashquestionresponse__c', req.body, function(err, result) {
		if (err) {
			console.log(err);
		}
		res.set('Content-Type', 'application/json');
		return res.send(JSON.stringify(result));
	})
});


app.use('/api', api);

app.use(express.static(__dirname + '/../www/'));

var server = app.listen(3000, '127.0.0.1', function() {
    console.log('Listening on port %d', server.address().port);
});

