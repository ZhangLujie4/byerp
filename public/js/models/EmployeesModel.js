﻿define([
    'Backbone',
    'Underscore',
    'Validation',
    'moment',
    'constants'
], function (Backbone, _, Validation, moment, CONSTANTS) {
    'use strict';

    var EmployeeModel = Backbone.Model.extend({
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
                    response.createdBy.date = moment(response.createdBy.date).format('YYYY-MM-DD, H:mm:ss');
                }
                if (response.editedBy) {
                    response.editedBy.date = moment(response.editedBy.date).format('YYYY-MM-DD, H:mm:ss');
                }
                if (response.dateBirth) {
                    response.dateBirth = moment(response.dateBirth).format('YYYY-MM-DD');
                }
                if (response.attachments) {
                    _.map(response.attachments, function (attachment) {
                        attachment.uploadDate = moment(attachment.uploadDate).format('YYYY-MM-DD, H:mm:ss');
                        return attachment;
                    });
                }
                if (response.notes) {
                    _.map(response.notes, function (note) {
                        note.date = moment(note.date).format('YYYY-MM-DD, H:mm:ss');
                        return note;
                    });
                }

                if (response.hire) {
                    response.hire = _.map(response.hire, function (hire) {
                        return moment(hire).format('YYYY-MM-DD');
                    });
                }
                if (response.social && response.social.LI) {
                    response.social.LI = response.social.LI.replace('[]', 'linkedin');
                }
                if (response.fire) {
                    response.fire = _.map(response.fire, function (fire) {
                        return moment(fire).format('YYYY-MM-DD');
                    });
                }
                if (response.transfer) {
                    response.transfer = _.map(response.transfer, function (transfer) {
                        transfer.date = moment(transfer.date).format('YYYY-MM-DD');
                        return transfer;
                    });
                }
                if (response.transferred) {
                    response.transferred = _.map(response.transferred, function (obj) {
                        obj.date = moment(obj.date).format('YYYY-MM-DD, H:mm:ss');
                        return obj;
                    });
                }
              if(response.labourContractDate && response.labourContractDate.startDate){
                   response.labourContractDate.startDate = moment(response.labourContractDate.startDate).format('YYYY-MM-DD');
              }
              if(response.labourContractDate && response.labourContractDate.endDate){
                response.labourContractDate.endDate = moment(response.labourContractDate.endDate).format('YYYY-MM-DD');
              }
            }
            return response;
        },

        validate: function (attrs) {
            var errors = [];

           // Validation.checkDateField(errors, true, attrs.dateBirth, 'Date of Birth');
           // Validation.checkNameField(errors, true, attrs.employmentType, 'Personal Information / Employment type');
           Validation.checkNameField(errors, true, attrs.name.first, '姓');
           Validation.checkNameField(errors, true, attrs.name.last, '名');
           //Validation.checkPhoneField(errors, true, attrs.workPhones.phone, '家庭电话');
           Validation.checkPhoneField(errors, true, attrs.workPhones.mobile, '手机号码');
           Validation.checkEmailField(errors, false, attrs.workEmail, '邮箱');
           Validation.checkEmailField(errors, true, attrs.personalEmail, '个人邮箱');
           // Validation.checkCountryCityStateField(errors, false, attrs.workAddress.country, 'Country');
           // Validation.checkCountryCityStateField(errors, false, attrs.workAddress.state, 'State');
           // Validation.checkCountryCityStateField(errors, false, attrs.workAddress.city, 'City');
           // Validation.checkZipField(errors, false, attrs.workAddress.zip, 'Zip');
           // Validation.checkStreetField(errors, false, attrs.workAddress.street, 'Street');
           // Validation.checkCountryCityStateField(errors, false, attrs.homeAddress.country, 'Country');
           // Validation.checkCountryCityStateField(errors, false, attrs.homeAddress.state, 'State');
           // Validation.checkZipField(errors, false, attrs.homeAddress.zip, 'Zip');
           // Validation.checkStreetField(errors, false, attrs.homeAddress.street, 'Street');
           //Validation.checkJobPositionField(errors, true, attrs.jobPosition, '岗位');
           Validation.checkJobPositionField(errors, true, attrs.identNo, '身份证');
           Validation.checkJobPositionField(errors, true, attrs.department, '部门');

            if (errors.length > 0) {
                return errors;
            }
        },

        defaults: {
            isEmployee: true,
            imageSrc  : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAABAAAAAQADq8/hgAAAEaElEQVRYw82X6XLbNhCA+f4PVomk5MRyHDtp63oEgDcl3vfRBQhQIEVKSvsnO+OxRBEfFnthV+n/pyi/NaCryzzL8rJu/wOgzQPXJBgjhDExnXPW/Aqgy30DI0yIwYQQ4Bhe2j0I6BIbI1jL9meC2TdkRu0jgMxCGN5H2HT8IIzjKPAdE9NngEjuAhqfv3rOpe3aIrDAFoB1qtuA3ADlMXKuz9vlLqZokt4CxPAOQXa2bPDCRVSJYB0QIDA4ibp+TVKDbuCvAeh6YpX9DWkcUGJCkAARXW9UfXeL0PmUcF4CZBA4cALv5nqQM+yD4mtATQMOGMi9RzghiKriCuBiAzsB1e8uwUUGtroZIAEsqfqHCI2JjdGZHNDSZzHYb0boQK4JOTVXNQFEoJXDPskEvrYTrJHgIwOdZEBrggXzfkbo+sY7Hp0Fx9bUYbUEAAtgV/waHAcCnOew3arbLy5lVXGSXIrKGQkrKKMLcnHsPjEGAla1PYi+/YCV37e7DRp1qUDjwREK1wjbo56hezRoPLxt9lzUg+m96Hvtz3BMcU9syQAxKBSJ/c2Nqv0Em5C/97q+BdGoEuoORN98CkAqzsAAPh690vdv2tOOEcx/dodP0zq+qjpoQQF7/Vno2UA0OgLQQbUZI6t/1+BlRgAlyywvqtNXja0HFQ7jGVwoUA0HUBNcMvRdpW8PpzDPYRAERfmNE/TDuE8Ajis4oJAiUwB2+g+am3YEEmT5kz4HgOdRygHUIPEMsFf/YvXJYoSKbPczQI4HwysSbKKBdk4dLAhJsptrUHK1lSERUDYD6E9pGLsjoXzRZgAIJVaYBCCfA57zMBoJYfV9CXDigHhRgww2Hgngh4UjnCUbJAs2CEdCkl25kbou5ABh0KkXPupA6IB8fOUF4TpFOs5Eg50eFSOBfOz0GYCWoJwDoJzwcjQBfM2rMAjD0CEsL/Qp4ISG/FHkuJ4A9toXv66KomosMMNAuAA6GxOWPwqP64sb3kTm7HX1Fbsued9BXjACZKNIphLz/FF4WIps6vqff+jaIFAONiBbTf1hDITti5RLg+cYoDOxqJFwxb0dXmT5Bn/Pn8wOh9dQnMASK4aaSGuk+G24DObCbm5XzkXs9RdASTuytUZO6Czdm2BCA2cSgNbIWedxk0AV4FVYEYFJpLK4SuA3DrsceQEQl6svXy33CKfxIrwAanqZBA8R4AAQWeUMwJ6CZ7t7BIh6utfos0uLwxqP7BECMaTUuQCoawhO+9sSUWtjs1kA9I1Fm8DoNiCl64nUCsp9Ym1SgncjoLoz7YTl9dNOtbGRYSAjWbMDNPKw3py0otNeufVYN2wvzha5g6iGzlTDebsfEdbtW9EsLOvYZs06Dmbsq4GjcoeBgThBWtRN2zZ1mYUuGZ7axfz9hZEns+mMQ+ckzIYm/gn+WQvWWRq6uoxuSNi4RWWAYGfRuCtjXx25Bh25MGaTFzaccCVX1wfPtkiCk+e6nh/ExXps/N6z80PyL8wPTYgPwzDiAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDExLTAxLTE5VDAzOjU5OjAwKzAxOjAwaFry6QAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxMC0xMi0yMVQxNDozMDo0NCswMTowMGxOe/8AAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAAAElFTkSuQmCC',
            name      : {
                first: '',
                last : ''
            },

            gender     : '',
            marital    : '',
            tags       : [],
            workAddress: {
                street : '',
                city   : '',
                state  : '',
                zip    : '',
                country: ''
            },

            workEmail    : '',
            personalEmail: '',
            workPhones   : {
                mobile: '',
                phone : ''
            },

            skype               : '',
            officeLocation      : '',
            relatedUser         : null,
            payrollStructureType: null,
            weeklyScheduler     : null,
            visibility          : 'Public',
            department          : '',
            jobPosition         : null,
            nationality         : '',
            identNo             : '',
            passportNo          : '',
            bankAccountNo       : '',
            otherId             : '',
            homeAddress         : {
                street : '',
                city   : '',
                state  : '',
                zip    : '',
                country: ''
            },

            source: {
                id  : '',
                name: ''
            },

            dateBirth: null,
            hire     : [],
            fire     : [],
            notes    : []
        },

        urlRoot: function () {
            return CONSTANTS.URLS.EMPLOYEES;
        }
    });
    return EmployeeModel;
});
