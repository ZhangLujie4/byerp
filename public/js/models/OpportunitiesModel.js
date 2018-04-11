define([
    'Backbone',
    'Underscore',
    'moment',
    'Validation',
    'constants'
], function (Backbone, _, moment, Validation, CONSTANTS) {
    'use strict';

    var OpportunityModel = Backbone.Model.extend({
        idAttribute: '_id',
        defaults   : {
            isOpportunitie : true,
            name           : '',
            expectedRevenue: {
                value   : 0,
                currency: '$',
                progress: ''
            },

            company: {
                id  : '',
                name: ''
            },

            contactName: {
                first: '',
                last : ''
            },

            customer: {
                id  : '',
                name: ''
            },

            address: {
                street : '',
                city   : '',
                state  : '',
                zip    : '',
                country: ''
            },

            email: '',

            phones: {
                mobile: '',
                phone : '',
                fax   : ''
            },

            func         : '',
            salesPerson  : null,
            salesTeam    : null,
            internalNotes: '',

            nextAction: {
                date: null,
                desc: ''
            },

            expectedClosing: null,
            priority       : 'Trivial',
            categories     : '',
            active         : true,
            optout         : false,
            reffered       : '',
            workflow       : '',
            archPerson     : null,
            archNumber     : 0,
            archerDate: {
                winDate  : null,
                archDate : null
            },

            leadDate: {
                bidDate     : null,
                bidbailDate : null,                 
                retDate     : null,   
                questionDate: null    
            },

            projectDesc  :{
                pD1:  '',
                pD2:  '',
                pD3:  '',
                pD4:  '',
                pD5:  ''
            },

            inforDesc  :{
                pD1:  '',
                pD2:  '',
                pD3:  '',
                pD4:  '',
                pD5:  '',
                pD6:  ''
            },

            biderDate   : null,
            openDate    : null,
            questions   : '',
            fieldDesc   : '',
            genUnit     : '',
            genDesc     : '',
            openState   : '',
            sealState   : '',
            bidFils     : '',
            pmReq       : '',
            entReq      : '',
            levelReq    : '',
            prjAmount   : 0,
            prjCost     : 0,
            prjQuota    : 0,
            bidCost     : 0,
            enrollCost  : 0,
            quoPerson   : null,
            busPerson   : null,
            otherDetail : ''
        },

        urlRoot: function () {
            return CONSTANTS.URLS.OPPORTUNITIES;
        },

        initialize: function () {
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
                if (response.creationDate) {
                    response.creationDate = moment(response.creationDate).format('YYYY-MM-DD');
                }

                if (response.expectedClosing) {
                    response.expectedClosing = moment(response.expectedClosing).format('YYYY-MM-DD');
                }

                if (response.nextAction) {
                    response.nextAction.date = moment(response.nextAction.date).format('YYYY-MM-DD');
                }

                if (response.convertedDate) {
                    response.convertedDate = moment(response.convertedDate).format('YYYY-MM-DD');
                }

                if (response.createdBy) {
                    response.createdBy.date = moment(response.createdBy.date).format('YYYY-MM-DD, H:mm:ss');
                }

                if (response.editedBy) {
                    response.editedBy.date = moment(response.editedBy.date).format('YYYY-MM-DD, H:mm:ss');
                }

                if (response.biderDate) {
                    response.biderDate = moment(response.biderDate).format('YYYY-MM-DD');
                }

                if (response.openDate) {
                    response.openDate = moment(response.openDate).format('YYYY-MM-DD');
                }

                if (response.leadDate) {
                    response.leadDate.retDate = moment(response.leadDate.retDate).format('YYYY-MM-DD');
                }

                if (response.archerDate) {
                    response.archerDate.winDate = moment(response.archerDate.winDate).format('YYYY-MM-DD');
                }

                if (response.archerDate) {
                    response.archerDate.archDate = moment(response.archerDate.archDate).format('YYYY-MM-DD');
                }

                if (response.notes) {
                    _.map(response.notes, function (note) {
                        note.date = moment(note.date).format('YYYY/MM/DD, H:mm:ss');

                        if (note.history && (note.history.changedField === 'Creation Date' || note.history.changedField === 'Close Date')){
                            note.history.changedValue = note.history.changedValue ? moment(new Date(note.history.changedValue)).format('YYYY/MM/DD') : '';
                            note.history.newValue = note.history.newValue ? moment(new Date(note.history.newValue)).format('YYYY/MM/DD') : '';
                            note.history.prevValue = note.history.prevValue ? moment(new Date(note.history.prevValue)).format('YYYY/MM/DD') : '';
                        }

                        return note;
                    });

                    response.notes.forEach(function(note, index) {
                        if (!note.name && note.history && (note.history.changedField === 'Creation Date')){
                            response.notes.splice(index, 1);
                            response.notes.unshift(note);
                            return;
                        }
                    });

                    response.notes.forEach(function(note, index) {
                        if (note.task && (note.task.workflow.status !== 'Done') && (note.task.workflow.status !== 'Cancelled')){
                            response.notes.splice(index, 1);
                            response.notes.push(note);
                            return;
                        }
                    });
                }

                if (response.attachments) {
                    _.map(response.attachments, function (attachment) {
                        attachment.uploadDate = moment(attachment.uploadDate).format('YYYY-MM-DD, H:mm:ss');
                        return attachment;
                    });
                }
            }
            return response;
        },

        validate: function (attrs) {
            var errors = [];
            Validation.checkJobPositionField(errors, true, attrs.name, '工程名称');
            Validation.checkJobPositionField(errors, true, attrs['address.street'] || attrs.address.street, '工程地址');
            Validation.checkJobPositionField(errors, true, attrs.biderDate, '投标日期');
            Validation.checkJobPositionField(errors, true, attrs.openDate, '开标日期');
            Validation.checkJobPositionField(errors, true, attrs['leadDate.retDate'] || attrs.leadDate.retDate, '合同退保证金日期');
            Validation.checkJobPositionField(errors, true, attrs.questions, '答疑日期及拟提问题');
            Validation.checkJobPositionField(errors, true, attrs.fieldDesc, '工程现场情况');
            Validation.checkJobPositionField(errors, true, attrs.genUnit, '总包单位情况');
            Validation.checkJobPositionField(errors, true, attrs.genDesc, '总包费用');
            Validation.checkJobPositionField(errors, true, attrs.openState, '开标形式');
            Validation.checkJobPositionField(errors, true, attrs.sealState, '封标形式及要求');
            Validation.checkJobPositionField(errors, true, attrs.bidFils, '投标文件组成');
            Validation.checkJobPositionField(errors, true, attrs.pmReq, '拟派项目经理');
            Validation.checkJobPositionField(errors, true, attrs.entReq, '企业业绩要求');
            Validation.checkJobPositionField(errors, true, attrs.levelReq, '资质原件要求');
            Validation.checkJobPositionField(errors, true, attrs['projectDesc.pD1'] || attrs.projectDesc.pD1, '工程概况');
            Validation.checkJobPositionField(errors, true, attrs['inforDesc.pD1'] || attrs.inforDesc.pD1, '工程设计要求');
            Validation.checkJobPositionField(errors, true, attrs['projectDesc.pD2'] || attrs.projectDesc.pD2, '工程付款方式');
            Validation.checkJobPositionField(errors, true, attrs['inforDesc.pD2'] || attrs.inforDesc.pD2, '标书报价要求');
            Validation.checkJobPositionField(errors, true, attrs['inforDesc.pD3'] || attrs.inforDesc.pD3, '需注意的废标条款');
            Validation.checkJobPositionField(errors, true, attrs['inforDesc.pD4'] || attrs.inforDesc.pD4, '评标方式');
            Validation.checkJobPositionField(errors, true, attrs['inforDesc.pD5'] || attrs.inforDesc.pD5, '业务部投标建议');
            Validation.checkJobPositionField(errors, true, attrs['inforDesc.pD6'] || attrs.inforDesc.pD6, '拟采用报价策略');
            Validation.checkJobPositionField(errors, true, attrs.prjAmount, '工程量(m2/m)');
            Validation.checkJobPositionField(errors, true, attrs.prjCost, '成本(万元)');
            Validation.checkJobPositionField(errors, true, attrs.prjQuota, '报价(万元)');
            Validation.checkJobPositionField(errors, true, attrs.bidCost, '投标费用');
            Validation.checkJobPositionField(errors, true, attrs.enrollCost, '报名及资格预审费用');
            Validation.checkJobPositionField(errors, true, attrs.quoPerson, '报价人员');
            Validation.checkJobPositionField(errors, true, attrs.busPerson, '业务联系人');
            Validation.checkJobPositionField(errors, true, attrs.expDepart, '费用承担部门');
            Validation.checkJobPositionField(errors, true, attrs.taxDesc, '计税方式');
            Validation.checkJobPositionField(errors, true, attrs.bailType, '保证金类型');
            Validation.checkJobPositionField(errors, true, attrs.bail, '保证金(元)');
            /*Validation.checkCountryCityStateField(errors, false, attrs.address.country, 'Country');
            Validation.checkCountryCityStateField(errors, false, attrs.address.state, 'State');
            Validation.checkCountryCityStateField(errors, false, attrs.address.city, 'City');
            Validation.checkMoneyField(errors, false, attrs.expectedRevenue.value, 'Expected revenue');*/
            if (errors.length > 0) {
                return errors;
            }
        }
    });
    return OpportunityModel;
});
