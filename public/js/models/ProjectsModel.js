define([
    'Backbone',
    'Underscore',
    'Validation',
    'common',
    'constants',
    'moment'
], function (Backbone, _, Validation, common, CONSTANTS,moment) {
    'use strict';
    var ProjectModel = Backbone.Model.extend({
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

            //Validation.checkGroupsNameField(errors, true, attrs.name, 'Project name');
            //Validation.checkGroupsNameField(errors, true, attrs.projectShortDesc, 'Short description');

            if (errors.length > 0) {
                return errors;
            }
        },

        defaults: {
            name            : '',
            lssArea           :'',
            pmv           :'',
            pmr           :'',
            proDate           :'',
            sealType           :'',
            StartDate: null,
            projectShortDesc: '',
            task            : [],
            privacy         : 'All Users',
            customer        : {
                _id : '',
                name: ''
            },

            projectmanager: {
                _id : '',
                name: ''
            },

            teams: {
                users: [],
                Teams: []
            },

            info: {

                duration : 0,
                EndDate  : null,
                sequence : 0,
                parent   : null
            },

            estimated: 0,
            logged   : 0,
            remaining: 0,
            progress : 0,
            notes    : [],
            bonus    : [],
            budget   : {
                bonus      : [],
                projectTeam: []
            }
        },

        parse: function (response) {
            if (!response.data) {
                if (response.createdBy) {
                    response.createdBy.date = common.utcDateToLocaleDateTime(response.createdBy.date);
                }
                if (response.editedBy) {
                    response.editedBy.date = common.utcDateToLocaleDateTime(response.editedBy.date);
                }
                if (response.StartDate) {
                    response.StartDate = moment(response.StartDate).format('YYYY-MM-DD');
                }
                if (response.EndDate) {
                    response.EndDate = common.utcDateToLocaleDate(response.EndDate);
                }
                if (response.TargetEndDate) {
                    response.TargetEndDate = moment(response.TargetEndDate).format('YYYY-MM-DD');
                }
                if (response.designRequire) {
                    response.designRequire.pushDate = moment(response.designRequire.pushDate).format('YYYY-MM-DD');
                }
                if (response.signedDate) {
                    response.signedDate = moment(response.signedDate).format('YYYY-MM-DD');
                }
                if (response.archDate) {
                    response.archDate = moment(response.archDate).format('YYYY-MM-DD');
                }
                if (response.notes) {
                    _.map(response.notes, function (note) {
                        note.date = common.utcDateToLocaleDate(new Date(note.date));
                        return note;
                    });
                }
                if (response.attachments) {
                    _.map(response.attachments, function (attachment) {
                        attachment.uploadDate = common.utcDateToLocaleDate(new Date(attachment.uploadDate));
                        return attachment;
                    });
                }
                if (response.sealType) {
                    switch(response.sealType){
                        case 'GZ':
                            response.sealType={};
                            response.sealType._id='GZ';
                            response.sealType.name='公章';
                            break;
                        case 'HTZYZ':
                            response.sealType={};
                            response.sealType._id='HTZYZ';
                            response.sealType.name='合同专用章';
                            break;
                    }
                }
                if (response.projectType) {
                    switch(response.projectType){
                        case 'GSXM':
                            response.projectType={};
                            response.projectType._id='GSXM';
                            response.projectType.name='公司项目';
                            break;
                        case 'GKXM':
                            response.projectType={};
                            response.projectType._id='GKXM';
                            response.projectType.name='挂靠项目';
                            break;
                        case 'HZXM1':
                            response.projectType={};
                            response.projectType._id='HZXM1';
                            response.projectType.name='合作项目1';
                            break;
                        case 'HZXM2':
                            response.projectType={};
                            response.projectType._id='HZXM2';
                            response.projectType.name='合作项目2';
                            break;
                        case 'HZXM3':
                            response.projectType={};
                            response.projectType._id='HZXM3';
                            response.projectType.name='合作项目3';
                            break;

                    }
                }
                return response;
            }
        },

        urlRoot: function () {
            return CONSTANTS.URLS.PROJECTS;
        }
    });
    return ProjectModel;
});
