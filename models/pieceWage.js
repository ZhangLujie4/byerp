module.exports = (function () {
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var pieceWagesSchema = mongoose.Schema({
        employeeName     : {type: ObjectId, ref: 'Employees', default: null},
        empDepartment    : {type: ObjectId, ref: 'Department', default: null},
        projectName      : {type: ObjectId, ref: 'Opportunities', default: null},
        workNumber       : {type: String, default: ''},
        processContent   : {type: String, default: ''},
        reckonDate       : {type: Date, default: null},
        employeeQuantity : {type: Number, default: 0},
        price            : {type: Number, default: 0},
        convertWage      : {type: Number, default: 0},
        janWage          : {type: Number, default: 0},
        febWage          : {type: Number, default: 0},
        marWage          : {type: Number, default: 0},
        aprWage          : {type: Number, default: 0},
        mayWage          : {type: Number, default: 0},
        junWage          : {type: Number, default: 0},
        julWage          : {type: Number, default: 0},
        augWage          : {type: Number, default: 0},
        sepWage          : {type: Number, default: 0},
        octWage          : {type: Number, default: 0},
        novWage          : {type: Number, default: 0},
        decWage          : {type: Number, default: 0},
        totalWage        : {type: Number, default: 0},
        publisher        : {type: String, default: ''}

        
    }, {collection: 'pieceWages'});

    mongoose.model('pieceWages', pieceWagesSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.PieceWage = pieceWagesSchema;
})();
