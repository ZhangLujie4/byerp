module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var routing;

    routing = {
        _id          : false,
        id           : false,
        jobName      : {type: String, default: ''},
        jobId        : {type: ObjectId, ref: 'workCentres', default: null},
        price        : {type: Number, default: 0},
        jobNumber    : {type: String, default: ''}
    };

    var aluveneerOrdersSchema = mongoose.Schema({
        projectName  : {type: ObjectId, ref: 'building', default: null},
        cgdh         : {type: String, default: ''},
        xh           : {type: Number},
        lbmc         : {type: String, default: ''},
        lbbh         : {type: String, default: ''},
        sfyx         : {type: String, default: ''},
        sqm          : {type: String, default: ''},
        cjlhf        : {type: Number, default: 0},
        szjys        : {type: String, default: ''},
        define1      : {type: String, default: ''},
        define2      : {type: String, default: ''},
        W            : {type: Number},
        L1           : {type: Number},
        L2           : {type: Number},
        L3           : {type: Number},
        L4           : {type: Number},
        L5           : {type: Number},
        L6           : {type: Number},
        sl           : {type: Number},
        dw           : {type: String, default: ''},
        dkjjmj       : {type: Number},
        zmj          : {type: Number},
        jgsh         : {type: String, default: ''},
        jgth         : {type: String, default: ''},
        comment      : {type: String, default: ''},
        dj           : {type: Number},
        ck           : {type: Number, default: 0},
        kc           : {type: Number, default: 0},
        routing      : [routing],
        boardType    : {type: String, default: ''},
        priApproval  : {type: Boolean, default: false},
        status       : {type: String, default: 'new'},
        location     : {type: String, default: ''},
        totalPrice   : {type: Number, default: 0},
        hfdj         : {type: Number, default: 0},
        kcdj         : {type: Number, default: 0},
        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        },

        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: null}
        }
        
    }, {collection: 'aluveneerOrders'});

    mongoose.model('aluveneerOrders', aluveneerOrdersSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.AluveneerOrder = aluveneerOrdersSchema;
})();
