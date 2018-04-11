module.exports = function (mainDb, dbsNames) {
    'use strict';

    var http = require('http');
    var path = require('path');
    var express = require('express');
    // var compression = require('compression');
    var session = require('express-session');
    var logger = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var consolidate = require('consolidate');
    var app = express();
    var dbsObject = mainDb.dbsObject;
    var MemoryStore = require('connect-mongo')(session);
    //session会话
    var sessionConfig = require('./config/session')(mainDb, MemoryStore);

    //允许跨域请求
    var allowCrossDomain = function (req, res, next) {
        var browser = req.headers['user-agent'];

        if (/Trident|Edge/.test(browser)) {
            res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        }
        next();

    };

    //判断是PC端还是手机端
    var chackMobile = function (req, res, next) {
        var client = req.headers['user-agent'];
        var regExp = /(mobile|iPhone)/i;

        if (req.session && !(req.session.isMobile === false || req.session.isMobile === true)) {
            req.session.isMobile = regExp.test(client);
        }
        next();

    };
    var httpServer;
    var io;

    app.set('dbsObject', dbsObject);
    app.set('dbsNames', dbsNames);
    app.engine('html', consolidate.swig);
    //view的后缀设置
    app.set('view engine', 'html');
    //定义view的目录
    app.set('views', __dirname + '/views');
    global.appRoot = path.resolve(__dirname);
    // app.use(compression());
    app.use(logger('dev'));
    app.use(bodyParser.json({strict: false, inflate: true, limit: 1024 * 1024 * 200}));
    app.use(bodyParser.urlencoded({extended: false, limit: 1024 * 1024 * 200}));
    app.use(cookieParser('CRMkey'));

    // todo uncomment it in production
    /* if (process.env.NODE_ENV !== 'production') {
        app.use(express.static(path.join(__dirname, 'public')));
    } */
    // todo comment it in production
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/customImages', express.static(path.join(__dirname, 'customImages')));
    app.use(session(sessionConfig));

    app.use(allowCrossDomain);
    app.use(chackMobile);

    //创建一个http服务器
    httpServer = http.createServer(app);
    io = require('./helpers/socket')(httpServer);

    app.set('io', io);

    //在这里引入了app的值
    require('./routes/index')(app, mainDb);

    return httpServer;
};
