module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/build/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var express = __webpack_require__(1);
	var Webtask = __webpack_require__(2);
	var app = express();
	var Request = __webpack_require__(3);
	var memoizer = __webpack_require__(4);

	function renderPublicImage(req, res) {
	  console.log('Request came');
	  var ctx = req.webtaskContext;
	  var required_settings = ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'ERROR_IMAGE_URL'];
	  var missing_settings = required_settings.filter(function (setting) {
	    return !ctx.data[setting];
	  });

	  if (missing_settings.length) {
	    return res.status(400).send({ message: 'Missing settings: ' + missing_settings.join(', ') });
	  }

	  getPublicProfile(ctx.data.AUTH0_DOMAIN, req.params.userId, req.access_token).then(function (profile) {
	    res.redirect(profile.picture);
	  }).catch(function (err) {
	    return res.redirect(ctx.data.ERROR_IMAGE_URL);
	  });
	}

	function renderPublicProfile(req, res) {
	  var ctx = req.webtaskContext;
	  var required_settings = ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'];
	  var missing_settings = required_settings.filter(function (setting) {
	    return !ctx.data[setting];
	  });

	  if (missing_settings.length) {
	    return res.status(400).send({ message: 'Missing settings: ' + missing_settings.join(', ') });
	  }

	  // No complex error handling
	  getPublicProfile(ctx.data.AUTH0_DOMAIN, req.params.userId, req.access_token).then(function (profile) {
	    res.json(profile);
	  }).catch(function (err) {
	    return res.status(404);
	  });
	}

	function getPublicProfile(domain, userId, token) {
	  return new Promise(function (resolve, reject) {
	    getProfileFromAuth0Cached(domain, userId, token, function (err, profile) {
	      if (err) return reject(err);
	      resolve(profile);
	    });
	  });
	}

	/* given a profile filter only the props we need */
	function filter(profile) {
	  return {
	    user_id: profile.user_id,
	    picture: profile.picture,
	    name: profile.name
	  };
	}

	var getProfileFromAuth0Cached = memoizer({
	  load: function load(domain, userId, token, cb) {
	    getProfileFromAuth0(domain, token, userId).then(function (profile) {
	      cb(null, filter(profile));
	    }).catch(cb);
	  },
	  hash: function hash(userId) {
	    return userId;
	  }
	});

	function getProfileFromAuth0(domain, token, userId, cb) {
	  var url = 'https://' + domain + '/api/v2/users/' + userId;
	  return new Promise(function (resolve, reject) {
	    Request({
	      method: 'GET',
	      url: url,
	      json: true,
	      headers: {
	        Authorization: 'Bearer ' + token,
	        Accept: 'application/json'
	      }
	    }, function (err, res, body) {
	      if (err) {
	        console.log('Error getting logs', err);
	        reject(err);
	      } else {
	        resolve(body);
	      }
	    });
	  });
	}

	var getTokenCached = memoizer({
	  load: function load(apiUrl, audience, clientId, clientSecret, cb) {
	    Request({
	      method: 'POST',
	      url: apiUrl,
	      json: true,
	      body: {
	        audience: audience,
	        grant_type: 'client_credentials',
	        client_id: clientId,
	        client_secret: clientSecret
	      }
	    }, function (err, res, body) {
	      if (err) {
	        cb(null, err);
	      } else {
	        cb(body.access_token);
	      }
	    });
	  },
	  hash: function hash(apiUrl) {
	    return apiUrl;
	  },
	  max: 100,
	  maxAge: 1000 * 60 * 60
	});

	app.use(function (req, res, next) {
	  var apiUrl = 'https://' + req.webtaskContext.data.AUTH0_DOMAIN + '/oauth/token';
	  var audience = 'https://' + req.webtaskContext.data.AUTH0_DOMAIN + '/api/v2/';
	  var clientId = req.webtaskContext.data.AUTH0_CLIENT_ID;
	  var clientSecret = req.webtaskContext.data.AUTH0_CLIENT_SECRET;
	  console.log(req);
	  getTokenCached(apiUrl, audience, clientId, clientSecret, function (access_token, err) {
	    if (err) {
	      console.log('Error getting access_token', err);
	      return next(err);
	    }

	    req.access_token = access_token;
	    next();
	  });
	});

	app.get('/:userId/image', renderPublicImage);
	app.get('/:userId', renderPublicProfile);

	module.exports = Webtask.fromExpress(app);

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("express");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("webtask-tools");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("request");

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("lru-memoizer");

/***/ }
/******/ ]);