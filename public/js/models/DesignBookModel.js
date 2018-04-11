define([
    'Backbone',
    'Underscore',
    'Validation',
    'common',
    'constants',
    'moment'
], function (Backbone, _, Validation, common, CONSTANTS,moment) {
    'use strict';
    var DesignBookModel = Backbone.Model.extend({
        idAttribute: '_id',
        initialize : function () {
            this.on('invalid', function (model, errors) {
                var msg;

                if (errors.length > 0) {
                    msg = errors.join('\n');

                    App.render({
                        type   : 'error',
                        message: msg
                    });
                }
            });
        },

        parse: function (response) {
            if (!response.data) {
                if (response.createdBy) {
                    response.createdBy.date = moment(response.createdBy.date).format('YYYY-MM-DD');
                }
                if (response.designDate) {
                    response.designDate = moment(response.designDate).format('YYYY-MM-DD');
                }
                if (response.designRequire) {
                    if(response.designRequire.pushDate){
                        response.designRequire.pushDate = moment(response.designRequire.pushDate).format('YYYY-MM-DD');
                    }
                }
                if(response.designContractType){
                    switch(response.designContractType){
                        case 'WBSJHT':
                            response.designContractType={};
                            response.designContractType._id='WBSJHT';
                            response.designContractType.name='外部设计合同';
                            break;
                        case 'XMBSJHT':
                            response.designContractType={};
                            response.designContractType._id='XMBSJHT';
                            response.designContractType.name='项目部设计合同';
                            break;
                        case 'NBSJHT':
                            response.designContractType={};
                            response.designContractType._id='NBSJHT';
                            response.designContractType.name='内部设计合同';
                            break;
                        case 'SJBAHT':
                            response.designContractType={};
                            response.designContractType._id='SJBAHT';
                            response.designContractType.name='设计备案合同';
                            break;
                    }
                }
                if(response.expenseDepartment){
                    switch(response.expenseDepartment){
                        case 'GSYWBM':
                            response.expenseDepartment={};
                            response.expenseDepartment._id='GSYWBM';
                            response.expenseDepartment.name='公司业务部门';
                            break;
                        default:
                            response.expenseDepartment={};
                            response.expenseDepartment._id='QT';
                            response.expenseDepartment.name='其他';
                            break;
                    }
                }
                if(response.designType&&response.designType.texture){
                    switch(response.designType.texture){
                        case 'BL':
                            response.designType.texture={};
                            response.designType.texture._id='BL';
                            response.designType.texture.name='玻璃';
                            break;
                        case 'JS':
                            response.designType.texture={};
                            response.designType.texture._id='JS';
                            response.designType.texture.name='金属';
                            break;
                        case 'SCMQ':
                            response.designType.texture={};
                            response.designType.texture._id='SCMQ';
                            response.designType.texture.name='石材幕墙';
                            break;
                        case 'RZBC':
                            response.designType.texture={};
                            response.designType.texture._id='RZBC';
                            response.designType.texture.name='人造板材';
                            break;
                        case 'QTXSMQ':
                            response.designType.texture={};
                            response.designType.texture._id='QTXSMQ';
                            response.designType.texture.name='其他新式幕墙';
                            break;
                    }
                }
                if(response.designType&&response.designType.structure){
                    switch(response.designType.structure){
                        case 'DYS':
                            response.designType.structure={};
                            response.designType.structure._id='DYS';
                            response.designType.structure.name='单元式';
                            break;
                        case 'GF':
                            response.designType.structure={};
                            response.designType.structure._id='GF';
                            response.designType.structure.name='光伏';
                            break;
                        case 'GJG':
                            response.designType.structure={};
                            response.designType.structure._id='GJG';
                            response.designType.structure.name='钢结构';
                            break;
                        case 'SC':
                            response.designType.structure={};
                            response.designType.structure._id='SC';
                            response.designType.structure.name='双层';
                            break;
                        case 'QTJG':
                            response.designType.structure={};
                            response.designType.structure._id='QTJG';
                            response.designType.structure.name='其他结构';
                            break;
                    }
                }
                if(response.designRequire&&response.designRequire.constructPicture){
                    switch(response.designRequire.constructPicture){
                        case 'ATBWJ':
                            response.designRequire.constructPicture={};
                            response.designRequire.constructPicture._id='ATBWJ';
                            response.designRequire.constructPicture.name='按投标文件';
                            break;
                        case 'ABZWJ':
                            response.designRequire.constructPicture={};
                            response.designRequire.constructPicture._id='ABZWJ';
                            response.designRequire.constructPicture.name='按编制文件';
                            break;
                    }
                }
                if(response.designRequire&&response.designRequire.conceptualPicture){
                    switch(response.designRequire.conceptualPicture){
                        case 'ATBWJ':
                            response.designRequire.conceptualPicture={};
                            response.designRequire.conceptualPicture._id='ATBWJ';
                            response.designRequire.conceptualPicture.name='按投标文件';
                            break;
                        case 'ABZWJ':
                            response.designRequire.conceptualPicture={};
                            response.designRequire.conceptualPicture._id='ABZWJ';
                            response.designRequire.conceptualPicture.name='按编制文件';
                            break;
                    }
                }

                return response;
            }
        },

        urlRoot: function () {
            return CONSTANTS.URLS.DESIGNBOOK;
        }
    });
    return DesignBookModel;
});
