var jsondb = require('./lib/pgdoc');

DBURL = "postgres://u8rhmp60csqisk:p4h0is6rj5qi8u1na4lpkv1gjp9@ec2-54-225-241-2.compute-1.amazonaws.com:5462/d36vcnnn386efv?ssl=true";
//DBURL = "postgres://localhost/connect_dev";

module.exports = {
	TWITTER_CONSUMER_KEY: '2FLFjvgAmSI0T76Qxn8qx3oVc',
	TWITTER_CONSUMER_SECRET: 'zoo3o7M0SInIq9MHIGTPpCueGPS0a0tQc30ttnTrOGlfcoal0r',
	TWITTER_CALLBACK_URL: 'http://localhost:8000/auth/twitter/callback',
	jsondb: jsondb.connect(DBURL, "salesforce", function() {})
}





