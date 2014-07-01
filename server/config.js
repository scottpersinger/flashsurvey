var jsondb = require('./lib/pgdoc');

DBURL = process.env.DATABASE_URL || process.env.SYNC_DB;
if (DBURL) {
	DBURL += "?ssl=true";
} else {
	DBURL = "postgres://localhost/connect_dev";
}

module.exports = {
	TWITTER_CONSUMER_KEY: '2FLFjvgAmSI0T76Qxn8qx3oVc',
	TWITTER_CONSUMER_SECRET: 'zoo3o7M0SInIq9MHIGTPpCueGPS0a0tQc30ttnTrOGlfcoal0r',
	TWITTER_CALLBACK_URL: 'http://localhost:8000/auth/twitter/callback',
	jsondb: jsondb.connect(DBURL, "salesforce", function() {})
}





