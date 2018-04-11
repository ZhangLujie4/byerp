define([
    'Backbone',
    'Underscore',
    'Validation',
    'common',
    'constants',
    'moment'
], function (Backbone, _, Validation, common, CONSTANTS,moment) {
    'use strict';
    var DesignProjectModel = Backbone.Model.extend({
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
                var name;
                if (response.createdBy) {
                    response.createdBy.date = moment(response.createdBy.date).format('YYYY-MM-DD');
                }
                if (response.signedDate) {
                    response.signedDate = moment(response.signedDate).format('YYYY-MM-DD');
                }
                if (response.archDate) {
                    response.archDate = moment(response.archDate).format('YYYY-MM-DD');
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


                if (response.attachments) {
                    _.map(response.attachments, function (attachment) {
                        attachment.uploadDate = common.utcDateToLocaleDate(new Date(attachment.uploadDate));
                        return attachment;
                    });
                }
                return response;
            }
        },

        urlRoot: function () {
            return CONSTANTS.URLS.DESIGNPROJECTS;
        }
    });
    return DesignProjectModel;
});
