
define([
    'Backbone',
    'Underscore',
    'common',
    'Validation',
    'constants',
    'moment'
], function (Backbone, _, common, Validation, CONSTANTS,moment) {
    'use strict';

    var OutContractModel = Backbone.Model.extend({
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
            if (response.StartDate) {
                response.StartDate = moment(response.StartDate).format('YYYY-MM-DD');
            }if (response.signedDate) {
                response.signedDate = moment(response.signedDate).format('YYYY-MM-DD');
            }
            if (response.finishDate) {
                response.finishDate = moment(response.finishDate).format('YYYY-MM-DD');
            }
            if (response.proDate) {
                response.proDate = moment(response.proDate).format('YYYY-MM-DD');
            }
            if (response.EndDate) {
                response.EndDate = common.utcDateToLocaleDate(response.EndDate);
            }

            if (response && response.attachments) {
                _.map(response.attachments, function (attachment) {
                    attachment.uploadDate = common.utcDateToLocaleDate(attachment.uploadDate);
                    return attachment;
                });
            }
            if (response.createdBy) {
                response.createdBy.date = common.utcDateToLocaleDateTime(response.createdBy.date);
            }
            if (response.editedBy && response.editedBy.date) {
                response.editedBy.date = common.utcDateToLocaleDateTime(response.editedBy.date);
            }
            if (response && response.notes) {
                _.map(response.notes, function (notes) {
                    notes.date = common.utcDateToLocaleDate(notes.date);
                    return notes;
                });
            }
            if (response.sealType) {
                switch(response.sealType){
                    case 'GZ':
                        response.sealType={};
                        response.sealType.name='公章';
                        response.sealType.id='GZ';
                        break;
                    case 'HTZYZ':
                        response.sealType={};
                        response.sealType.name='合同专用章';
                        response.sealType.id='HTZYZ';
                        break;

                }
            }
            if (response.preAmountType) {
                switch(response.preAmountType){
                    case 'HQHKZBZKC':
                        response.preAmountType={};
                        response.preAmountType.name='后期货款中不做扣除';
                        response.preAmountType.id='HQHKZBZKC';
                        break;
                    case 'SCFKZKC':
                        response.preAmountType={};
                        response.preAmountType.name='首次付款中扣除';
                        response.preAmountType.id='SCFKZKC';
                        break;
                    case 'TBLKC':
                        response.preAmountType={};
                        response.preAmountType.name='同比例扣除';
                        response.preAmountType.id='TBLKC';
                        break;
                    case 'WKZKC':
                        response.preAmountType={};
                        response.preAmountType.name='尾款中扣除';
                        response.preAmountType.id='WKZKC';
                        break;

                }
            }
            if (response.paymentType) {
                switch(response.paymentType){
                    case 'DPAYAJE':
                        response.paymentType={};
                        response.paymentType.name='单批按月,按金额';
                        response.paymentType.id='DPAYAJE';
                        break;
                    case 'DPAYASL':
                        response.paymentType={};
                        response.paymentType.name='单批按月,按数量';
                        response.paymentType.id='DPAYASL';
                        break;
                    case 'DPAJDAJE':
                        response.paymentType={};
                        response.paymentType.name='单批按节点,按金额';
                        response.paymentType.id='DPAJDAJE';
                        break;
                    case 'DPAJDASL':
                        response.paymentType={};
                        response.paymentType.name='单批按节点,按数量';
                        response.paymentType.id='DPAJDASL';
                        break;

                }
            }
            if (response.payType) {
                switch(response.payType){
                    case 'NDZF':
                        response.payType={};
                        response.payType.name='年底支付';
                        response.payType.id='NDZF';
                        break;
                    case 'AZWCZF':
                        response.payType={};
                        response.payType.name='安装完成支付';
                        response.payType.id='AZWCZF';
                        break;
                    case 'YSHGZF':
                        response.payType={};
                        response.payType.name='验收合格支付';
                        response.payType.id='YSHGZF';
                        break;
                    case 'ZBJ':
                        response.payType={};
                        response.payType.name='质保金';
                        response.payType.id='ZBJ';
                        break;

                }
            }
            if (response.carriage) {
                switch(response.carriage){
                    case 'AJE':
                        response.carriage={};
                        response.carriage.name='按金额';
                        response.carriage.id='AJE';
                        break;
                    case 'ADHDD':
                        response.carriage={};
                        response.carriage.name='按到货地点';
                        response.carriage.id='ADHDD';
                        break;

                }
            }
            if (response.quota) {
                switch(response.quota){
                    case 'ACL':
                        response.quota={};
                        response.quota.name='按材料';
                        response.quota.id='ACL';
                        break;
                    case 'ADW':
                        response.quota={};
                        response.quota.name='按单位';
                        response.quota.id='ADW';
                        break;
                    case 'AJE':
                        response.quota={};
                        response.quota.name='按金额';
                        response.quota.id='AJE';
                        break;

                }
            }
            return response;
        },


        validate: function (attrs) {
            var errors = [];

            // Validation.checkGroupsNameField(errors, true, attrs.summary, 'Summary');
            Validation.checkGroupsNameField(errors, true, attrs.project._id || attrs.project, 'Project');
            //Validation.checkGroupsNameField(errors, true, attrs.assignedTo._id || attrs.assignedTo, 'AssignedTo');

            if (attrs.deadline && attrs.StartDate) {
                Validation.checkFirstDateIsGreater(errors, attrs.deadline, 'deadline date', attrs.StartDate, 'Start date');
            }

            if (errors.length > 0) {
                return errors;
            }
        },

        urlRoot: function () {
            return CONSTANTS.URLS.OUTCONTRACT;
        }
    });
    return OutContractModel;
});

