define([
    'Backbone',
    'Underscore',
    'common',
    'Validation',
    'constants',
    'moment'
], function (Backbone, _, common, Validation, CONSTANTS,moment) {
    'use strict';

    var cashDepositModel = Backbone.Model.extend({
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
            if (response.applyDate) {
                response.applyDate = moment(response.applyDate).format('YYYY-MM-DD');
            }if (response.endDate) {
                response.endDate = moment(response.endDate).format('YYYY-MM-DD');
            }if (response.payDate) {
                response.payDate = moment(response.payDate).format('YYYY-MM-DD');
            }if (response.openDate) {
                response.openDate = moment(response.openDate).format('YYYY-MM-DD');
            }if (response.type) {
                switch(response.type){
                    case 'tender':
                        response.type='投标保证金';
                        break;
                    case 'salary':
                        response.type='民工工资保证金';
                        break;
                    case 'deposit':
                        response.type='押金';
                        break;
                    case 'reputation':
                        response.type='信誉保证金';
                        break;
                    case 'perform':
                        response.type='投标保证金';
                        break;
                    case 'quality':
                        response.type='质量保证金';
                        break;
                    case 'guarantee':
                        response.type='保函保证金';
                        break;
                    case 'construction':
                        response.type='安全文明施工保证金';
                        break;

                }
            }
            if (response.flow) {
                switch(response.flow){
                    case 'apply':
                        response.flow={};
                        response.flow._id='apply';
                        response.flow.name='已申请';
                        break;
                    case 'check':
                        response.flow={};
                        response.flow._id='check';
                        response.flow.name='已审核';
                        break;
                    case 'pay':
                        response.flow={};
                        response.flow._id='pay';
                        response.flow.name='已支付';
                        break;
                    case 'return':
                        response.flow={};
                        response.flow._id='return';
                        response.flow.name='退保中';
                        break;
                    case 'finish':
                        response.flow={};
                        response.flow._id='finish';
                        response.flow.name='已退保';
                        break;
                }
            }
            if (response.depositType) {
                switch(response.depositType){
                    case 'cash':
                        response.depositType='保证金';
                        break;
                    case 'deposit':
                        response.depositType='押金';
                        break;
                }
            }
            if (response.paymentMethod) {
                switch(response.paymentMethod){
                    case 'cash':
                        response.paymentMethod='现金';
                        break;
                    case 'deposit':
                        response.paymentMethod='银行存款';
                        break;
                    case 'guarantee':
                        response.paymentMethod='银行保函';
                        break;
                }
            }

            return response;
        },


        urlRoot: function () {
            return CONSTANTS.URLS.CASHDEPOSIT;
        }
    });
    return cashDepositModel;
});
