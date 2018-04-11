'use strict';

var mongoose = require('mongoose');
var dbsObject = {};
var models = require('./helpers/models')(dbsObject);
var dbsNames = {};
var connectOptions;
var mainDb;
var app;

require('pmx').init();

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
//加载环境配置
require('./config/environment/' + process.env.NODE_ENV);

// replset & mongos are needed when database was split in to replSet and shards
connectOptions = {
    db    : {native_parser: true},
    server: {poolSize: 5},
    // replset: { rs_name: 'myReplicaSetName' },
    user  : process.env.DB_USER,
    pass  : process.env.DB_PASS,
    w     : 1,
    j     : true
    // mongos: true
};

//mongodb连接，地址端口名字和映射
mainDb = mongoose.createConnection(process.env.MAIN_DB_HOST, process.env.MAIN_DB_NAME, process.env.DB_PORT, connectOptions);
mainDb.on('error', function (err) {
    err = err || 'connection error';
    process.exit(1, err);
});

//只调用一次
mainDb.once('open', function callback() {
    var mainDBSchema;
    var port = parseInt(process.env.PORT, 10) || 8089;
    var instance = parseInt(process.env.NODE_APP_INSTANCE, 10) || 0;
    var main;
    
    port += instance;
    //得到了所有的dbs的object
    mainDb.dbsObject = dbsObject;
    console.log('Connection to mainDB is success');
    //加载所有的对象
    require('./models/index.js');
    mainDBSchema = mongoose.Schema({
        _id   : Number,
        url   : {type: String, default: 'localhost'},
        DBname: {type: String, default: ''},
        pass  : {type: String, default: ''},
        user  : {type: String, default: ''},
        port  : Number
    }, {collection: 'easyErpDBS'});

    //相当于加载了easyErpDBS这个集合
    main = mainDb.model('easyErpDBS', mainDBSchema);
    main.find().exec(function (err, result) {
        if (err) {
            process.exit(1, err);
        }

        result.forEach(function (_db, index) {
            var dbInfo = {
                DBname: '',
                url   : ''
            };
			
            var opts = {
                db    : {native_parser: true},
                server: {poolSize: 5},
                // replset: { rs_name: 'myReplicaSetName' },
                user  : _db.user,
                pass  : _db.pass,
                w     : 1,
                j     : true
                // mongos: true
            };
            //返回db类型
            var dbObject = mongoose.createConnection(_db.url, _db.DBname, _db.port, opts);
            //TODO ?
            var Scheduler = require('./services/scheduler')(models);

            dbObject.on('error', function (err) {
                console.error(err);
            });
            //调度日程安排
            dbObject.once('open', function () {
                var scheduler = new Scheduler(_db.DBname);

                console.log('Connection to ' + _db.DBname + ' is success' + index);
                dbInfo.url = result[index].url;
                dbInfo.DBname = result[index].DBname;
                dbsObject[_db.DBname] = dbObject;
                dbsNames[_db.DBname] = dbInfo;

                //初始化每天的日程
                scheduler.initEveryDayScheduler();
            });
        });
    });
    mainDb.mongoose = mongoose;

    //返回了mainDb和dbsNames（存有dbname和db.url）
    app = require('./app')(mainDb, dbsNames);

    //监听端口
    app.listen(port, function () {
        console.log('==============================================================');
        console.log('|| server start success on port=' + port + ' in ' + process.env.NODE_ENV + ' version ||');
        console.log('==============================================================\n');
    });
});
