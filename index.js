const express   = require('express');
const Webtask   = require('webtask-tools');
const app       = express();
const Request   = require('request');
const memoizer  = require('lru-memoizer');


function renderPublicImage (req, res) {
  console.log('Request came');
  let ctx               = req.webtaskContext;
  let required_settings = ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'ERROR_IMAGE_URL'];
  let missing_settings  = required_settings.filter((setting) => !ctx.data[setting]);

  if (missing_settings.length) {
    return res.status(400).send({ message: 'Missing settings: ' + missing_settings.join(', ') });
  }

  getPublicProfile(ctx.data.AUTH0_DOMAIN, req.params.userId, req.access_token).then(function (profile) {
    res.redirect(profile.picture);
  }).catch(err => res.redirect(ctx.data.ERROR_IMAGE_URL));
}


function renderPublicProfile (req, res) {
  let ctx               = req.webtaskContext;
  let required_settings = ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'];
  let missing_settings  = required_settings.filter((setting) => !ctx.data[setting]);

  if (missing_settings.length) {
    return res.status(400).send({ message: 'Missing settings: ' + missing_settings.join(', ') });
  }

  // No complex error handling
  getPublicProfile(ctx.data.AUTH0_DOMAIN, req.params.userId, req.access_token).then(function (profile) {
    res.json(profile);
  }).catch(err => res.status(404));
}

function getPublicProfile (domain, userId, token) {
  return new Promise(function (resolve, reject) {
    getProfileFromAuth0Cached(domain, userId, token, function(err, profile){
      if(err) return reject(err);
      resolve(profile);
    });
  });
}

/* given a profile filter only the props we need, we should be able to over-ride this so that we can fetch these on demand */
function filter(profile) {
  return {
    user_id: profile.user_id,
    picture: profile.picture,
    name: profile.name
  };
}

const getProfileFromAuth0Cached = memoizer({
  load: function(domain, userId, token, cb){
    getProfileFromAuth0(domain, token, userId).then(function (profile){
      cb(null, filter(profile));
    }).catch(cb);
  },
  hash: (userId) => userId
});

function getProfileFromAuth0 (domain, token, userId, cb) {
  var url = `https://${domain}/api/v2/users/${userId}`;
  return new Promise(function (resolve, reject) {
    Request({
      method: 'GET',
      url: url,
      json: true,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    }, (err, res, body) => {
      if (err) {
        console.log('Error getting logs', err);
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}

const getTokenCached = memoizer({
  load: (apiUrl, audience, clientId, clientSecret, cb) => {
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
    }, (err, res, body) => {
      if (err) {
        cb(null, err);
      } else {
        cb(body.access_token);
      }
    });
  },
  hash: (apiUrl) => apiUrl,
  max: 100,
  maxAge: 1000 * 60 * 60
});

app.use(function (req, res, next) {
  var apiUrl       = `https://${req.webtaskContext.data.AUTH0_DOMAIN}/oauth/token`;
  var audience     = `https://${req.webtaskContext.data.AUTH0_DOMAIN}/api/v2/`;
  var clientId     = req.webtaskContext.data.AUTH0_CLIENT_ID;
  var clientSecret = req.webtaskContext.data.AUTH0_CLIENT_SECRET;
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
