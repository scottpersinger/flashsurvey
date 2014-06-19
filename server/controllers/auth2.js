var bcrypt = require('bcrypt'),
    config = require('../config')
    jsondb = config.jsondb,
    uuid = require('node-uuid'),
    Q = require('q'),
    validator = require('validator'),
    winston = require('winston'),
    invalidCredentials = 'Invalid email or password';

/**
 * Encrypt password with per-user salt
 * @param password
 * @param callback
 */
function encryptPassword(password, callback) {
    winston.info('encryptPassword');
    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return callback(err);
        }
        bcrypt.hash(password, salt, function (err, hash) {
            return callback(err, hash);
        });
    });
}

/**
 * Compare clear with hashed password
 * @param password
 * @param hash
 * @param callback
 */
function comparePassword(password, hash, callback) {
    winston.info('comparePassword, ' + password, ' to ', hash);
    bcrypt.compare(password, hash, function (err, match) {
        if (err) {
            return callback(err);
        }
        return callback(null, match);
    });
}

/**
 * Create an access token
 * @param user
 * @returns {promise|*|Q.promise}
 */
function createAccessToken(user) {
    winston.info('createAccessToken');
    var token = uuid.v4(),
        deferred = Q.defer();
    
    jsondb.create('access_tokens', {user_id:user.id, token:token}).then(function(token) {
        deferred.resolve(token);
    }).catch(deferred.reject);

    return deferred.promise;
}

/**
 * Regular login with application credentials
 * @param req
 * @param res
 * @param next
 * @returns {*|ServerResponse}
 */
function login(req, res, next) {
    winston.info('login');

    var creds = req.body;

    // Don't allow empty passwords which may allow people to login using the email address of a Facebook user since
    // these users don't have passwords
    if (!creds.password || !validator.isLength(creds.password, 1)) {
        return res.send(401, invalidCredentials);
    }

    jsondb.find_one('app_users', {email:creds.email}).then(function(user) {
        comparePassword(creds.password, user.password, function (err, match) {
            if (err) return next(err);
            if (match) {
                createAccessToken(user)
                    .then(function(token) {
                        return res.json({'user':{'email': user.email}, 'token': token.token});
                    })
                    .catch(function(err) {
                        return next(err);    
                    });
            } else {
                // Passwords don't match
                return res.send(401, invalidCredentials);
            }
        });

    }, function () {
        return res.send(401, invalidCredentials);
    });
};

/**
 * Logout user
 * @param req
 * @param res
 * @param next
 */
function logout(req, res, next) {
    winston.info('logout');
    var token = req.headers['authorization'];
    winston.info('Logout token:' + token);

    jsondb.delete('access_tokens', {token:token})
        .then(function () {
            winston.info('Logout successful');
            res.send('OK');
        })
        .catch(next);
};

/**
 * Signup
 * @param req
 * @param res
 * @param next
 * @returns {*|ServerResponse}
 */
function signup(req, res, next) {
    winston.info('signup');

    var user = req.body;
    console.log("SIGNUP!", req.body);
    
    if (!validator.isEmail(user.email)) {
        return res.send(400, "Invalid email address");
    }
    if (!validator.isLength(user.password, 4)) {
        return res.send(400, "Password must be at least 4 characters");
    }

    jsondb.find('app_users', {email:user.email}, function(err, result) {
        if (result && result.length > 0) {
            return next(new Error('Email address already registered'));
        } else {
            encryptPassword(user.password, function (err, hash) {
                if (err) return next(err);
                user.password = hash;
                createUser(user)
                    .then(function () {
                        return res.send('OK');
                    })
                    .catch(next);
            });
        }
    }).catch(function(err) {
       res.send(500, err);
    });
};

/**
 * Create a user
 * @param user
 * @param password
 * @returns {promise|*|Q.promise}
 */
function createUser(user) {

    var deferred = Q.defer();

    jsondb.find('contact', {email:user.email}).then(function(result) {
        if (result && result.length > 0) {
            //user.contact_sfid = result[0].sfid;
        } else {
            var cDef = Q.defer();
            jsondb.create('contact', {email:user.email, external_id__c: user.email, 
                                      firstname:'New', lastname:'User'}, function(err, result) {
                // Need to set user.contact_sfid, although email is really the key
                if (err) {
                    cDef.reject(err);
                } else {
                    cDef.resolve(result);
                }
            });
            return cDef.promise;
        }
    }).then(function() {
        jsondb.create('app_users', user, function(err, result) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(result);
            }
        });

    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

/**
 * Validate authorization token
 * @param req
 * @param res
 * @param next
 * @returns {*|ServerResponse}
 */
function validateToken (req, res, next) {
    winston.info('validateToken');
    var token = req.headers['authorization'];
    if (!token) {
        winston.info('No token provided');
        return res.send(401, 'Invalid token');
    }
    jsondb.find('access_tokens', {token: token})
        .then(function (rows) {
            if (!rows || rows.length == 0) {
                winston.info('Invalid token');
                return res.send(401, 'Invalid token');
            }
            var item = rows[0];
            winston.info('Valid token for user: ' + item.user_id);
            console.log('token: ' + JSON.stringify(item));
            req.userId = item.user_id;
            return next();
        })
        .catch(next);
};

exports.login = login;
exports.logout = logout;
exports.signup = signup;
exports.createUser = createUser;
exports.createAccessToken = createAccessToken;
exports.validateToken = validateToken;