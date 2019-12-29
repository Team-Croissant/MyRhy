const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const signale = require('signale');
const fs = require('fs'),
    http = require('http'),
    https = require('https'),
    express = require('express');
const subdomain = require('express-subdomain');
const api = express.Router();
const session = require('express-session');
const OrientDB = require("orientjs");
const OrientoStore = require('connect-oriento')(session);
const nodemailer = require('nodemailer');
const hasher = require("pbkdf2-password")();
const app = express();
const i18n = require('./i18n');

const config = require('./config/config.json');

app.locals.pretty = true;
const port = 80;
const httpsPort = 443;

const privateKey = fs.readFileSync(config.keys.key, 'utf8');
const certificate = fs.readFileSync(config.keys.crt, 'utf8');

const lawInfo = fs.readFileSync('views/others/개인정보처리방침.txt', 'utf8');

const {google} = require('googleapis');
const plus = google.plus('v1');
const OAuth2 = google.auth.OAuth2;
const ClientId = config.google.clientId;
const ClientSecret = config.google.clientSecret;
const RedirectionUrl = "https://rhyga.me";

const server = OrientDB({
  host:config.orient.host,
  port:config.orient.port,
  username:config.orient.username,
  password:config.orient.password
});

const db = server.use(config.orient.db);

app.use(session({
   secret: config.app_pw.secret,
   resave: config.app_pw.resave,
   saveUninitialized: config.app_pw.saveUninitialized,
   store: new OrientoStore({
     server: config.store.server
   })
}));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'myrhydevelopteam@gmail.com',
    pass: config.orient.password
  }
});

app.use(session({
    secret: config.app_pw.secret,
    resave: config.app_pw.resave,
    saveUninitialized: config.app_pw.saveUninitialized,
    store: new OrientoStore({
      server: config.store.server
    })
}));

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(i18n);
app.use(subdomain('api', api));

api.get('/', function(req, res) {
  res.send('Welcome to our API!');
});

function getOAuthClient() {
  return new OAuth2(ClientId, ClientSecret, RedirectionUrl);
}

function getAuthUrl() {
  var oauth2Client = getOAuthClient();
  
  var scopes = [
      'https://www.googleapis.com/auth/plus.me'
  ];

  var url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
  });

  return url;
}

app.get('/', function(req, res){
  if(req.session.accessToken && req.session.refreshToken) {
    res.redirect('/game');
  } else {
    res.render('index');
  }
});

app.get('/en', function(req, res) {
  res.cookie('lang', 'en');
  res.redirect('/');
});

app.get('/ko', function(req, res) {
  res.cookie('lang', 'ko');
  res.redirect('/');
});

app.post("/login", function(req, res) {
  var oauth2Client = getOAuthClient();
  var code = req.body.code;
  oauth2Client.getToken(code, function(err, tokens) {
      if (!err) {
        oauth2Client.setCredentials({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token
        });
        req.session.accessToken = tokens.access_token;
        req.session.refreshToken = tokens.refresh_token;
        plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
          res.end('{"msg": "success"}');
        });
      } else {
        res.end('{"msg": "fail"}');
      }
  });
});

app.get("/game", function(req, res) {
  var oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: req.session.accessToken,
    refresh_token: req.session.refreshToken
  });
  plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
    if(err) {
      res.render('accessDenined');
    } else {
      req.session.userid = response.data.id;
      db.query("select from User where userid = :id", {params: { id: response.data.id }})
      .all()
      .then((results)=> {
        if(Object.keys(results).length !== 0) {
          if(req.session.authorized) {
            if(response.data.id == results[0].userid) {
              res.render('game', { name : results[0].nickname, id : response.data.id, settings : JSON.stringify(results[0].settings) });
            }
          } else {
              res.redirect('/authorize');
          }
        } else {
          req.session.tempEmail = response.data.emails[0].value;
          req.session.tempName = response.data.displayName;
          res.redirect('/join');
        }
      });
    }
  });
});

app.get("/join", function(req, res) {
  if(req.session.tempName) {
    res.render('join', { name : req.session.tempName });
  } else {
    res.render('accessDenined');
  }
});

app.post("/join", function(req, res) {
  const nameReg = /^[a-zA-Z0-9_-]{5,12}$/;
  const passReg = /^[0-9]{4,6}$/;
  if(req.session.tempName && req.session.accessToken && req.session.refreshToken && nameReg.test(req.body.displayName) && passReg.test(req.body.secondaryPassword)) {
    db.class.get('User').then(function(user){
      hasher({password:req.body.secondaryPassword}, (err, pass, salt, hash) => {
        user.create({
          userid : req.session.userid,
          salt : salt,
          secondary : hash,
          nickname : req.body.displayName,
          email : req.session.tempEmail,
          settings : {
            private : {
              'advancedStatus' : 0,
              'advancedDate' : ''
            },
            general : {
              'lang' : 'en'
            },
            display : {
              'FPScounter' : true,
              'elementsRes' : 'auto',
              'autoImg' : true,
              'genEffect' : true,
              'lightEffect' : true
            },
            ingame : {
              'brightness' : 25,
              'blur' : 100,
              'genEffect' : true,
              'comEffect' : true,
              'lightEffect' : true
            },
            sound : {
              'musicVolume' : 10,
              'effectVolume' : 5,
              'offset' : 0
            }
          }
        }).then(() => {
          delete req.session.tempName;
          delete req.session.tempEmail;
          res.redirect("/authorize");
        });
      });
    });
  } else {
    res.render('accessDenined');
  }
});

app.get("/authorize", function(req, res) {
  if(req.session.accessToken && req.session.refreshToken && req.session.userid) {
    if(req.session.authorized) {
      res.redirect('/game');
    }
    if(req.query.status == 'fail') {
      res.render('authorizeFail')
    } else {
      res.render('authorize');
    }
  } else {
    res.render('accessDenined');
  }
});

app.post("/authorize", function(req, res) {
  const passReg = /^[0-9]{4,6}$/;
  if(passReg.test(req.body.secondaryPassword)) {
    db.query("select from User where userid = :id", {params: { id: req.session.userid }})
      .all()
      .then((results)=> {
          hasher({password:req.body.secondaryPassword, salt:results[0].salt}, (err, pass, salt, hash) => {
            if(hash == results[0].secondary) {
              req.session.authorized = true;
              res.redirect('/game');
            } else {
              res.redirect('/authorize?status=fail');
            }
          });
      });
  } else {
    res.render('accessDenined');
  }
});

app.get("/logout", function(req, res) {
  delete req.session.authorized;
  delete req.session.accessToken;
  delete req.session.refreshToken;
  delete req.session.userid;
  delete req.session.tempName;
  delete req.session.tempEmail;
  res.redirect('/');
});

app.use(function(req, res, next) {
  res.status(404).render('404');
});

http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(port, function() {
  signale.success(`HTTP Server running at port ${port}.`);
});

https.createServer({
    key: privateKey,
    cert: certificate
}, app).listen(httpsPort, function() {
  signale.success(`HTTPS Server running at port ${httpsPort}.`);
});