define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/busiTripDetail/editTemplate.html',
    'populate',
    'constants',
    'helpers',
    'moment'
], function (Backbone, $, _, ParentView, EditTemplate, populate ,CONSTANTS ,helpers, moment) {
    'use strict';

    var EditView = ParentView.extend({
        contentType: "busiTripDetail",
        template   : _.template(EditTemplate),
        responseObj :{},
        events: {
        },

        initialize: function (options) {
            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/busiTripDetail';
            this.redirect = options.redirect;
            if (options.collection) {
                this.collection = options.collection;
            }

            this.render();
        },

         hideDialog: function () {
            $('.edit-busiTrip-dialog').remove();
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function(){
            var self = this;
            var mid = 39;
            var ID = this.$el.find('#ID').text();
            var employee = $.trim(this.$el.find('#employeesDd').data('id'));
            var registrationDate = $.trim(this.$el.find('#registrationDate').text());
            var datefrom = $.trim(this.$el.find('#datefrom').val());
            var dateto = $.trim(this.$el.find('#dateto').val());
            var description = $.trim(this.$el.find('#description').val());
            
            var aircompany = $.trim(this.$el.find('#aircompany').val());
            var airself = $.trim(this.$el.find('#airself').val());
            var train = $.trim(this.$el.find('#train').val());
            var bus = $.trim(this.$el.find('#bus').val());
            var taxi = $.trim(this.$el.find('#taxi').val());
            var kilometer = $.trim(this.$el.find('#kilometer').val());
            var roadtoll = $.trim(this.$el.find('#roadtoll').val());
            var parkingfee = $.trim(this.$el.find('#parkingfee').val());

            var accommodationDay = this.$el.find('#accommodationDay').val();
            var diningNumber = this.$el.find('#diningNumber').val();

            var status = this.$el.find('#status').data('id');
            var approve = false;
            var data;

            data = {
                    ID         : ID,
                    name       : employee,
                    registrationDate: registrationDate,
                    date       :{
                        from   : datefrom,
                        to     : dateto 
                    },
                    description: description,
                    air        :{
                        company: aircompany,
                        self   : airself
                    },
                    train      : train,
                    bus        : bus,
                    taxi       : taxi,
                    status     : status,
                    selfdrive  :{
                        kilometer: kilometer,
                        roadtoll : roadtoll,
                        parkingfee: parkingfee
                    },
                    accommodationDay: accommodationDay,
                    diningNumber: diningNumber,
                    editedBy  :{
                        user   :'',
                        date   :new Date() 
                    },
                    approve : approve
                };
            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                wait   : true,
                patch  : true,
                success: function () {
                    self.hideDialog();
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },
        
        render: function () {
            var self = this;
            var formString;
            var buttons;
            var model = this.currentModel.toJSON();

            this.$el.delegate(function(events){
                event.stopPropagation();
                event.preventDefault();
            });

            formString = this.template({
                model           : model,
            });

            buttons = [
                {
                    text : '保存',
                    class: 'btn blue',
                    click: function () {
                        self.saveItem();
                    }
                },
                {
                    text : '关闭',
                    class: 'btn',
                    click: function () {
                        self.hideDialog();
                    }
                }
            ];

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-busiTrip-dialog',
                title        : 'Edit busiTrip',
                width        : self.isWtrack ? '1200' : '900',
                position     : {my: 'center bottom', at: 'center', of: window},
                buttons      : buttons

            });

            populate.get2name('#employeesDd',CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false, true);

            
            this.$el.find('#datefrom').datepicker({
                dateFormat : 'yy-mm-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
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
                
            return this;
        }

    });

    return EditView;
});
