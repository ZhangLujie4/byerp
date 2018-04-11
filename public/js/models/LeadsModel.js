define([
    'Backbone',
    'Validation',
    'moment',
    'constants'
], function (Backbone, Validation, moment, CONSTANTS) {
    'use strict';

    var LeadModel = Backbone.Model.extend({
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

        validate: function (attrs) {
            var errors = [];

            Validation.checkJobPositionField(errors, true, attrs.name, '工程名称');
            Validation.checkJobPositionField(errors, true, attrs['address.street'] || attrs.address.street, '工程地址'); 
            Validation.checkJobPositionField(errors, true, attrs['regDepart'] || attrs.regDepart, '登记部门');
            Validation.checkJobPositionField(errors, true, attrs.transactor, '经办人');
            Validation.checkJobPositionField(errors, true, attrs.bail, '保证金(元)');
            Validation.checkJobPositionField(errors, true, attrs['contactName.first'] || attrs.contactName.first, '联系人');
            Validation.checkJobPositionField(errors, true, attrs.proManager, '项目经理');
            Validation.checkJobPositionField(errors, true, attrs.bidDepartment, '投标申请部门');
            Validation.checkJobPositionField(errors, true, attrs['projectDesc.pD1'] || attrs.projectDesc.pD1, '工程概况');
            Validation.checkJobPositionField(errors, true, attrs['projectDesc.pD2'] || attrs.projectDesc.pD2, '工程付款方式');
            Validation.checkJobPositionField(errors, true, attrs['projectDesc.pD4'] || attrs.projectDesc.pD4, '业务联系人意见');
            Validation.checkJobPositionField(errors, true, attrs['projectDesc.pD5'] || attrs.projectDesc.pD5, '资格预审收费金额');
            // Validation.checkGroupsNameField(errors, false, attrs.company.name, 'Company'); // commented in hotFix By Liliya
            Validation.checkPhoneField(errors, false, attrs['phones.phone'] || attrs.phones.phone, 'Phone');
            Validation.checkPhoneField(errors, false, attrs['phones.mobile'] || attrs.phones.mobile, 'Mobile');
            //Validation.checkCountryCityStateField(errors, false, attrs['address.country'] || attrs.address.country, 'Country');
            //Validation.checkCountryCityStateField(errors, false, attrs['address.state'] || attrs.address.state, 'State');
            //Validation.checkCountryCityStateField(errors, false, attrs['address.city'] || attrs.address.city, 'City');
            //Validation.checkZipField(errors, false, attrs['address.zip'] || attrs.address.zip, 'Zip');
            //Validation.checkStreetField(errors, false, attrs['address.street'] || attrs.address.street, 'Street');
            //Validation.checkEmailField(errors, false, attrs.email, 'Email');
            Validation.checkNotesField(errors, false, attrs.internalNotes, 'Notes');
            if (errors.length > 0) {
                return errors;
            }
        },

        parse: function (response) {
            if (!response.data) {
                if (response.createdBy) {
                    response.createdBy.date = moment(response.createdBy.date).format('YYYY-MM-DD');
                }
                if (response.social && response.social.LI) {
                    response.social.LI = response.social.LI.replace('[]', 'linkedin');
                }
                if (response.editedBy) {
                    response.editedBy.date = moment(response.editedBy.date).format('YYYY-MM-DD, H:mm:ss');
                }

                if (response.expectedClosing) {
                    response.expectedClosing = moment(response.expectedClosing).format('YYYY-MM-DD');
                }

                if (response.dateBirth) {
                    response.dateBirth = moment(response.dateBirth).format('YYYY-MM-DD');
                }

                if (response.leadDate) {
                    response.leadDate.bidDate = moment(response.leadDate.bidDate).format('YYYY-MM-DD');
                }

                if (response.leadDate) {
                    response.leadDate.bidbailDate = moment(response.leadDate.bidbailDate).format('YYYY-MM-DD');
                }

                if (response.notes) {
                    _.map(response.notes, function (note) {
                        note.date = moment(note.date).format('YYYY-MM-DD, H:mm:ss');

                        if (note.history && (note.history.changedField === 'Close Date' || note.history.changedField === 'Creation Date')) {
                            note.history.changedValue = note.history.changedValue ? moment(new Date(note.history.changedValue)).format('DD MMM, YYYY') : '';
                            note.history.newValue = note.history.newValue ? moment(new Date(note.history.newValue)).format('DD MMM, YYYY') : '';
                            note.history.prevValue = note.history.prevValue ? moment(new Date(note.history.prevValue)).format('DD MMM, YYYY') : '';
                        }

                        return note;
                    });

                    response.notes.forEach(function (note, index) {
                        if (!note.name && note.history && (note.history.changedField === 'Creation Date')) {
                            response.notes.splice(index, 1);
                            response.notes.unshift(note);
                            return;
                        }
                    });

                    response.notes.forEach(function (note, index) {
                        if (note.task && (note.task.workflow.status !== 'Done') && (note.task.workflow.status !== 'Cancelled')) {
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
                return response;
            }
        },

        defaults: {
            isOpportunitie: false,
            createCustomer: false,
            name          : 'New Lead',
            company       : {
                id  : '',
                name: ''
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

            salesPerson: {
                id  : '',
                name: ''
            },

            salesTeam: {
                id  : '',
                name: ''
            },

            contactName: {
                first: '',
                last : ''
            },

            email : '',
            func  : '',
            phones: {
                mobile: '',
                phone : '',
                fax   : ''
            },

            priority  : 'Trivial',
            categories: {
                id  : '',
                name: ''
            },

            internalNotes: '',
            active       : true,
            optout       : false,
            sequence     : 0,
            reffered     : '',
            workflow     : {
                wName : 'lead',
                name  : 'New',
                status: 'New'
            },

            social: {
                LI: '',
                FB: ''
            },

            skype: '',

            leadDate: {
                bidDate     : null,
                bidbailDate : null,  
                retDate     : null,   
                questionDate: null    
            },

            biderDate   : null,   
            openDate    : null, 

            questions : '',  
            fieldDesc : '',  
            genUnit   : '',   
            genDesc   : '',    

            openState : '',  
            sealState : '',   
            bidFils   : '',   
            pmReq     : '',  

            entReq    : '',   
            levelReq  : '',  
            isWon     : false, 
            prjAmount : 0,    
            prjCost   : 0,    
            prjQuota  : 0,    

            bidCost   : 0,   
            enrollCost: 0,    
            taxDesc   : '',  
            bailType  : '',   
            bail      : 0,    
            comments  : '',

            projectDesc  :{
                pD1:  '',
                pD2:  '',
                pD3:  '',
                pD4:  '',
                pD5:  ''
            },

            isComproject  : false,
            regDepart     : '',

            proManager    : '',
            transactor    : '',
            recordDate    : '',
            isBid         : false,
            bidDepartment : ''
        },

        urlRoot: function () {
            return CONSTANTS.URLS.LEADS;
        }
    });

    return LeadModel;
});
