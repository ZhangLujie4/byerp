define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/Employees/CreateTemplate.html',
    'models/EmployeesModel',
    'models/TransferModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/Assignees/AssigneesView',
    'views/dialogViewBase',
    'constants',
    'moment',
    'helpers',
    'dataService',
    'distpicker'
], function (Backbone,
             $,
             _,
             CreateTemplate,
             EmployeeModel,
             TransferModel,
             common,
             populate,
             AttachView,
             AssigneesView,
             ParentView,
             CONSTANTS,
             moment,
             helpers,
             dataService,
             distpicker) {
    'use strict';

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'Employees',
        template   : _.template(CreateTemplate),
        imageSrc   : '',
        responseObj: {},

        initialize: function () {
            this.mId = CONSTANTS.MID[this.contentType];
            _.bindAll(this, 'saveItem');
            this.model = new EmployeeModel();

            this.responseObj['#employmentTypeDd'] = [
                {
                    _id : 'Employees',
                    name: 'Employees'
                }, {
                    _id : 'FOP',
                    name: 'FOP'
                }, {
                    _id : 'Un Employees',
                    name: 'Un Employees'
                }
            ];

            this.responseObj['#sourceDd'] = [
                {
                    _id : 'www.rabota.ua',
                    name: 'www.rabota.ua'
                }, {
                    _id : 'www.work.ua',
                    name: 'www.work.ua'
                }, {
                    _id : 'www.ain.net',
                    name: 'www.ain.net'
                }, {
                    _id : 'other',
                    name: 'other'
                }
            ];

            this.responseObj['#genderDd'] = [
                {
                    _id : 'male',
                    name: '男'
                }, {
                    _id : 'female',
                    name: '女'
                }
            ];
            this.responseObj['#maritalDd'] = [
                {
                    _id : 'married',
                    name: '已婚'
                }, {
                    _id : 'unmarried',
                    name: '未婚'
                }
            ];

            this.render();
        },

        events: {
            'mouseenter .avatar'   : 'showEdit',
            'mouseleave .avatar'   : 'hideEdit',
            'click td.editable'    : 'editJob',
            'click .icon-attach'   : 'clickInput',
            'keyup #personalEmail' : 'onEmailEdit',
            'change #personalEmail': 'onEmailEdit',
            'paste #personalEmail' : 'onEmailEdit',
            'cut #personalEmail'   : 'onEmailEdit',
            'click #identNo'       : 'showBirthday'
        },

        clickInput: function () {
            this.$el.find('.input-file .inputAttach').click();
        },

        showBirthday: function(e){
        var identNo = $.trim(this.$el.find('#identNo').val());
        var genderDd = $.trim(this.$el.find('#genderDd').val());
        var home2 = '',dateBirth2 = '',sex = '';
        dateBirth2 = identNo.substring(6,10)+'-'+identNo.substring(10,12)+'-'+identNo.substring(12,14);
            if(identNo == ''){
                this.$el.find('#dateBirth').val('');
            }else{
                this.$el.find('#dateBirth').val(dateBirth2);
            }
             if(identNo.length==15){
                 sex = identNo.substring(14,15)%2==0 ? '女':'男';
             }else if(identNo.length==18){
                 sex = identNo.substring(14,17)%2==0 ? '女':'男';
             }
             this.$el.find('#genderDd').text(sex);
             if(sex=='女'){
                 this.$el.find('#genderDd').attr('data-id','female');
            }else{
                this.$el.find('#genderDd').attr('data-id','male');
            }
       }, 

        editJob: function (e) {
            var self = this;
            var $thisEl = this.$el;
            var $target = $(e.target);
            var dataId = $target.attr('data-id');
            var tempContainer;

            tempContainer = ($target.text()).trim();

            if (dataId === 'salary') {
                $target.html('<input class="editing statusInfo" type="text" value="' + tempContainer + '">');
                return false;
            }

            $target.html('<input class="editing statusInfo" type="text" value="' + tempContainer + '" ' + 'readonly' + '>');

            $target.find('.editing').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNamesShort: ['1月','2月','3月','4月','5月','6月', '7月','8月','9月','10月','11月','12月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate    : self.hiredDate,
               /* $target.find('.editing').datepicker({
                dateFormat : 'd M, yy',
                changeMonth: true,
                changeYear : true,
                minDate    : self.hiredDate,*/
                onSelect   : function () {
                    var editingDates = $thisEl.find('.editing');

                    editingDates.each(function () {
                        var target = $(this);
                        target.parent().text(target.val()).removeClass('changeContent');
                        target.remove();
                    });
                }
            }).addClass('datepicker');

            return false;
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var $td = $target.closest('td');
            var parentUl = $target.parent();
            var $element = $target.closest('a') || parentUl.closest('a');
            var id = $element.attr('id') || parentUl.attr('id');
            var valueId = $target.attr('id');
            var managersIds = this.responseObj['#departmentManagers'];
            var managers = this.responseObj['#projectManagerDD'];
            var managerId;
            var manager;
            var $departmentsDd = $('#departmentsDd');
            var jobPositions = this.responseObj['#jobPositionDd'];
            var jobPosition;
            var departments = this.responseObj['#departmentsDd'];
            var department;
            var jobTypes = this.responseObj['#jobTypeDd'];
            var jobType;


            $td.removeClass('errorContent');

            if (id === 'jobPositionDd' || 'departmentsDd' || 'projectManagerDD' || 'jobTypeDd' || 'hireFireDd') {
                $element.text($target.text());
                $element.attr('data-id', valueId);


                if(id === 'jobTypeDd'){

                    jobType = _.find(jobType, function (el) {
                        return el._id === valueId;
                    });
                }

                if (id === 'departmentsDd') {

                    managersIds.forEach(function (managerObj) {
                        if (managerObj._id === valueId) {
                            managerId = managerObj.name;
                        }
                    });

                    managers.forEach(function (managerObj) {
                        if (managerObj._id === managerId) {
                            manager = managerObj.name;
                        }
                    });

                    if (manager) {
                        $element = $element.closest('tr').find('a#projectManagerDD');

                        $element.text(manager);
                        $element.attr('data-id', managerId);

                        $element.closest('td').removeClass('errorContent');
                    }
                }

                if (id === 'jobPositionDd') {

                    jobPosition = _.find(jobPositions, function (el) {
                        return el._id === valueId;
                    });

                    department = _.find(departments, function (el) {
                        return el._id === jobPosition.department;
                    });

                    $departmentsDd.text(department.name);
                    $departmentsDd.attr('data-id', department._id);

                    $departmentsDd.closest('td').removeClass('errorContent');
                }

            } else {
                $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            }
        },

        addAttach: function () {
            var $thisEl = this.$el;
            var s = $thisEl.find('.inputAttach:last').val().split('\\')[$thisEl.find('.inputAttach:last').val().split('\\').length - 1];

            $thisEl.find('.attachContainer').append('<li class="attachFile">' +
                '<a href="javascript:;">' + s + '</a>' +
                '<a href="javascript:;" class="deleteAttach">Delete</a></li>'
            );
            $thisEl.find('.attachContainer .attachFile:last').append($thisEl.find('.input-file .inputAttach').attr('hidden', 'hidden'));
            $thisEl.find('.input-file').append('<input type="file" value="Choose File" class="inputAttach" name="attachfile">');
        },

        deleteAttach: function (e) {
            $(e.target).closest('.attachFile').remove();
        },

        onEmailEdit: function (e) {
            var $targetEl = $(e.target);
            var enteredEmail = $targetEl.val();
            var $thisEl = this.$el;
            var $userName = $thisEl.find('#userName');

            function retriveUserName(str) {
                var symbolPos;

                str = str || '';
                symbolPos = str.indexOf('@');

                if (symbolPos === -1) {
                    symbolPos = str.length;
                }

                return str.substring(0, symbolPos);
            }

            if ($userName.length) {
                $userName.text(retriveUserName(enteredEmail));
            }
        },

        fileSizeIsAcceptable: function (file) {
            if (!file) {
                return false;
            }
            return file.size < App.File.MAXSIZE;
        },

        saveItem: function () {
            var accommodation;
            var dinning;
            var weeklyScheduler;
            var transfer;
            var employeeModel;
            var transferModel;
            var homeAddress;
            var dateBirthSt;
            var self = this;
            var nationality;
            var jobPosition;
            var relatedUser;
            var isEmployee;
            var $jobTable;
            var department;
            var hireArray;
            var fireArray;
            var lastFire;
            var whoCanRW;
            var sourceId;
            var groupsId;
            var dataType;
            var userName;
            var manager;
            var marital;
            var employmentType;
            var jobType;
            var usersId;
            var salary;
            var gender;
            var coach;
            var event;
            var data;
            var dateText;
            var date;
            var info;
            var $tr;
            var el;
            var $thisEl = this.$el;
            var payrollStructureType;
            var scheduledPay;
            var notes = [];
            var note;
            var internalNotes = $.trim(this.$el.find('#internalNotes').val());
            var contractStart;
            var contractEnd;

          /*  if ($thisEl.find('.errorContent').length) {
                return App.render({
                    type   : 'error',
                  message: 'Please fill Job tab'
                });
            }*/

            employeeModel = new EmployeeModel();

            relatedUser = $thisEl.find('#relatedUsersDd').attr('data-id') || null;
            coach = $.trim($thisEl.find('#coachDd').attr('id')) || null;
            whoCanRW = $thisEl.find('[name="whoCanRW"]:checked').val();
            dateBirthSt = $.trim($thisEl.find('#dateBirth').val());
            $jobTable = $thisEl.find('#hireFireTable');
            marital = $thisEl.find('#maritalDd').attr('data-id') || null;
            employmentType = $thisEl.find('#employmentTypeDd').attr('data-id') || null;
            nationality = $thisEl.find('#nationality').attr('data-id');
            gender = $thisEl.find('#genderDd').attr('data-id');
            accommodation = $thisEl.find('#accommodation').val();
            dinning = $thisEl.find('#dinning').val();
            $tr = $jobTable.find('tr.transfer');
            sourceId = $thisEl.find('#sourceDd').attr('data-id');
            userName = $.trim($thisEl.find('#userName').text());
            contractStart = $thisEl.find('#contractStart').val();
            contractEnd = $thisEl.find('#contractEnd').val();
            homeAddress = {};
            fireArray = [];
            hireArray = [];
            groupsId = [];
            usersId = [];

            if (internalNotes) {
                note = {
                    title: '',
                    note : internalNotes
                };
                notes.push(note);
            }

            $thisEl.find('dd').find('.homeAddress').each(function (index, addressLine) {
                el = $thisEl.find(addressLine);
                homeAddress[el.attr('name')] = $.trim(el.val()) || el.attr('data-id');
            });

            salary = parseInt(helpers.spaceReplacer($tr.find('[data-id="salary"] input').val()) || helpers.spaceReplacer($tr.find('[data-id="salary"]').text()), 10) || 0;
            manager = $tr.find('#projectManagerDD').attr('data-id') || null;
            dateText = $.trim($tr.find('td').eq(2).text());
            date = dateText ? helpers.setTimeToDate(new Date(dateText)) : helpers.setTimeToDate(new Date());
            jobPosition = $tr.find('#jobPositionDd').attr('data-id');
            weeklyScheduler = $tr.find('#weeklySchedulerDd').attr('data-id');
            payrollStructureType = $tr.find('#payrollStructureTypeDd').attr('data-id') || null;
            scheduledPay = $tr.find('#scheduledPayDd').attr('data-id') || null;
            department = $tr.find('#departmentsDd').attr('data-id');
            jobType = $.trim($tr.find('#jobTypeDd').attr('data-id'));
            info = $tr.find('#statusInfoDd').val();
            event = $tr.attr('data-content');

            hireArray.push(date);

            isEmployee = true;

            $thisEl.find('.groupsAndUser tr').each(function (index, element) {
                dataType = $thisEl.find(element).attr('data-type');

                if (dataType === 'targetUsers') {
                    usersId.push($thisEl.find(element).attr('data-id'));
                }

                if (dataType === 'targetGroups') {
                    groupsId.push($thisEl.find(element).attr('data-id'));
                }

            });

            data = {
                name: {
                    first: $.trim($thisEl.find('#first').val()),
                    last : $.trim($thisEl.find('#last').val()),
                    alpha: $.trim($thisEl.find('#alpha').val()),
                },

                accommodation:accommodation,
                dinning:dinning,
                gender        : gender,
                jobType       : jobType,
                marital       : marital,
                employmentType: employmentType,
                workAddress   : {
                    street : $.trim($thisEl.find('#street').val()),
                    city   : $.trim($thisEl.find('#city').val()),
                    state  : $.trim($thisEl.find('#state').val()),
                    zip    : $.trim($thisEl.find('#zip').val()),
                    country: $.trim($thisEl.find('#country').val())
                },

                social: {
                    LI: $.trim($thisEl.find('#LI').val()).replace('linkedin', '[]'),
                    FB: $.trim($thisEl.find('#FB').val())
                },

                tags         : $.trim($thisEl.find('#tags').val()).split(','),
                workEmail    : $.trim($thisEl.find('#workEmail').val()),
                personalEmail: $.trim($thisEl.find('#personalEmail').val()),
                skype        : $.trim($thisEl.find('#skype').val()),
                workPhones   : {
                    phone : $.trim($thisEl.find('#phone').val()),
                    mobile: $.trim($thisEl.find('#mobile').val())
                },

                notes          : notes,
                officeLocation : $.trim($thisEl.find('#officeLocation').val()),
                bankAccountNo  : $.trim($thisEl.find('#bankAccountNo').val()),
                relatedUser    : relatedUser,
                department     : department,
                jobPosition    : jobPosition,
                manager        : manager,
                coach          : coach,
                weeklyScheduler: weeklyScheduler,
                identNo        : $.trim($thisEl.find('#identNo').val()),
                passportNo     : $.trim($thisEl.find('#passportNo').val()),
                otherId        : $.trim($thisEl.find('#otherId').val()),
                homeAddress    : homeAddress,
                dateBirth      : dateBirthSt,
                source         : sourceId,
                imageSrc       : self.imageSrc,
                nationality    : nationality,
                isEmployee     : isEmployee,
                lastFire       : lastFire,
                userName       : userName,
                groups         : {
                    owner: $thisEl.find('#allUsersSelect').attr('data-id') || null,
                    users: usersId,
                    group: groupsId
                },

                whoCanRW: whoCanRW,
                hire    : hireArray,
                fire    : fireArray,
                
                workId: $.trim($thisEl.find('#workId').val()),
                nation: $.trim($thisEl.find('#nation').val()),
                bankName: $.trim($thisEl.find('#bankName').val()),
                accountLocation: $.trim($thisEl.find('#accountLocation').val()),
                birthPlace: $.trim($thisEl.find('#birthPlace').val()),
                education: $.trim ($thisEl.find('#education').val()),
                status: $thisEl.find('#status').val()? $thisEl.find('#status').val():1,
                address   : {
                    province : $.trim($thisEl.find('#province').val()),
                    city     : $.trim($thisEl.find('#city').val()),
                    district : $.trim($thisEl.find('#district').val()),
                    detailed : $.trim($thisEl.find('#detailed').val()),
                    zip      : $.trim($thisEl.find('#zip').val())
                },
                labourContractDate: {
                    startDate: contractStart,
                    endDate: contractEnd
                },
                deptRank: $.trim($thisEl.find('#deptRank').val()),
                workCentre: $thisEl.find('#workCentre').data('id')? $thisEl.find('#workCentre').data('id'):null

            };

            employeeModel.save(data, {
                headers: {
                    mid: 39
                },

                success: function (model) {
                    if (model.get('relatedUser') === App.currentUser._id) {
                        App.currentUser.imageSrc = self.imageSrc;

                        $('#loginPanel .iconEmployee').attr('src', self.imageSrc);
                        $('#loginPanel #userName').text(model.toJSON().fullName);
                    }

                    self.attachView.sendToServer(null, model.changed);

                    // Backbone.history.fragment = '';
                    // Backbone.history.navigate(window.location.hash, {trigger: true, replace: true});
                    self.hideDialog();

                    transfer = {
                        status              : event,
                        date                : date,
                        department          : department,
                        jobPosition         : jobPosition,
                        manager             : manager,
                        jobType             : jobType,
                        salary              : salary,
                        info                : info,
                        weeklyScheduler     : weeklyScheduler,
                        employee            : model.get('id'),
                        scheduledPay        : scheduledPay,
                        payrollStructureType: payrollStructureType
                    };

                    transferModel = new TransferModel();
                    transferModel.save(transfer, {
                        error: function (model, xhr) {
                            self.errorNotification(xhr);
                        }
                    });
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }

            });

        },

        render: function () {
            var formString = this.template({
                moment: moment
            });
            var $notDiv;
            var self = this;
            var $thisEl;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 900,
                title      : 'Create Employee',
                buttons    : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        id   : 'createBtnDialog',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }
                }
            });

            $thisEl = this.$el;

            $notDiv = $thisEl.find('.attach-container');

            this.attachView = new AttachView({
                model      : new EmployeeModel(),
                contentType: self.contentType,
                isCreate   : true
            });
            $notDiv.append(this.attachView.render().el);
            $notDiv = this.$el.find('.assignees-container');
            $notDiv.append(
                new AssigneesView({
                    model      : this.currentModel,
                    contentType: self.contentType
                }).render().el
            );

            populate.get('#departmentManagers', 'departments/getForDd', {}, 'departmentManager', this);
            populate.get('#jobTypeDd', CONSTANTS.URLS.JOBPOSITIONS_JOBTYPE, {}, 'name', this, false);
            populate.get('#nationality', CONSTANTS.URLS.EMPLOYEES_NATIONALITY, {}, '_id', this, true);
            populate.get2name('#projectManagerDD', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false);
            populate.get('#relatedUsersDd', CONSTANTS.URLS.USERS_FOR_DD, {}, 'login', this, true, true);
            populate.get('#departmentsDd', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, true, true);
            populate.get('#weeklySchedulerDd', CONSTANTS.URLS.WEEKLYSCHEDULER, {}, 'name', this, true);
            populate.get('#payrollStructureTypeDd', CONSTANTS.URLS.PAYROLLSTRUCTURETYPES_FORDD, {}, 'name', this, true);
            populate.get('#scheduledPayDd', CONSTANTS.URLS.SCHEDULEDPAY_FORDD, {}, 'name', this, true);
            populate.get('#employeeCreateCountry', CONSTANTS.URLS.COUNTRIES, {}, '_id', this);
            populate.get('#workCentre', 'workCentre/getForDD', {}, 'name', this, true, true);

            dataService.getData(CONSTANTS.URLS.JOBPOSITIONS_FORDD, {}, function (jobPositions) {
                self.responseObj['#jobPositionDd'] = jobPositions.data;
            });

            common.canvasDraw({model: this.model.toJSON()}, this);


           $thisEl.find('#hire').datepicker({
                //dateFormat : 'd M, yy',
               dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNamesShort: ['1月','2月','3月','4月','5月','6月', '7月','8月','9月','10月','11月','12月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
              /* yearRange  : '-100y:c+nn',
                maxDate    : '-18y',*/
                minDate    : null
               
            });

           this.$el.find('#address').distpicker({
                    province: '省份',
                    city: '城市',
                    district: '区',
                    detailed: '详细地址'
           });

          this.$el.find('#contractStart').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNamesShort: ['1月','2月','3月','4月','5月','6月', '7月','8月','9月','10月','11月','12月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
              /* yearRange  : '-100y:c+nn',
                maxDate    : '-18y',*/
                minDate    : null
          });

          this.$el.find('#contractEnd').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNamesShort: ['1月','2月','3月','4月','5月','6月', '7月','8月','9月','10月','11月','12月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
              /* yearRange  : '-100y:c+nn',
                maxDate    : '-18y',*/
                minDate    : null
          });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
