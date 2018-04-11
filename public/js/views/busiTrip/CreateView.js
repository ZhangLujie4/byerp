define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/busiTrip/createTemplate.html',
    'models/busiTripModel',
    'common',
    'populate',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'constants',
    'moment',
    'helpers',
    'dataService'
], function (Backbone, $, _, CreateTemplate, busiTripModel, common, populate, ParentView, AttachView ,CONSTANTS, moment, helpers, dataService) {
    'use strict';

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'busiTrip',
        template   : _.template(CreateTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.model = new busiTripModel();
            this.render(options);
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function () {
            var self = this;
            var mid = 118;
            var employee = $.trim(this.$el.find('#employeesDd').data('id'));
            var registrationDate = $.trim(this.$el.find('#registrationDate').val());
            var datefrom = $.trim(this.$el.find('#datefrom').val());
            var dateto = $.trim(this.$el.find('#dateto').val());
            var description = $.trim(this.$el.find('#description').val());
            var accommodationDay = this.$el.find('#accommodationDay').val();
            var diningNumber = this.$el.find('#diningNumber').val();


            this.model.save(
                {
                    
                    name       : employee,
                    registrationDate: registrationDate,
                    date       :{
                        from   : datefrom,
                        to     : dateto 
                    },
                    description: description,

                    accommodationDay: accommodationDay,
                    diningNumber: diningNumber,
                    createdBy  :{
                        user   :'',
                        date   :new Date() 
                    },
                    editedBy  :{
                        user   :'',
                        date   :new Date() 
                    }
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {

                        Backbone.history.navigate('easyErp/busiTrip', {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
        },

        hideSaveCancelBtns: function () {
            var cancelBtnEl = $('#top-bar-saveBtn');
            var saveBtnE1 = $('#top-bar-deleteBtn');
            var createBtnE1 = $('#top-bar-createBtn');
            this.changed = false;

            cancelBtnEl.hide();
            saveBtnE1.hide();
            createBtnE1.show();
            return false;
        },

        render: function (options) {
            
            var formString = this.template();
            var self = this;
            var notDiv;
            var date = moment().format("YYYY-MM-DD");


            this.$el = $(formString).dialog({
                closeOnEscape: false,
                draggable    : true,
                autoOpen     : true,
                resizable    : true,
                dialogClass: 'edit-dialog',
                width      : 900,
                title      : 'Create busiTrip',
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
                            self.hideSaveCancelBtns();
                        }
                    }
                }
            });

            dataService.getData('/busiTrip/getEmployee', {contentType: this.contentType}, function (response,context) {

                var empId = response.data._id;
                var empName = response.data.name.first + ' ' + response.data.name.last;
                context.$el.find('#employeesDd').attr('data-id',empId);
                context.$el.find('#employeesDd').text(empName);

            },this);

            this.$el.find('#registrationDate').val(date);
            
            this.$el.find('#datefrom').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                onSelect: function(selectedDate){
                          if(moment(selectedDate).isBefore(moment(),'date')){
                            alert('该申请单为后补');
                          }
                          return false;
                        }
            });
            this.$el.find('#dateto').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;

});
