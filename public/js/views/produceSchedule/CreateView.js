define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/produceSchedule/CreateTemplate.html',
    'models/produceScheduleModel',
    'common',
    'populate',
    'dataService',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants'
], function (Backbone, $, _, ParentView, CreateTemplate, produceScheduleModel, common, populate, dataService, AttachView, SelectView, CONSTANTS) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'produceSchedule',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'      : 'showDatePicker',
        },

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new produceScheduleModel();
            this.responseObj['#produceType'] = [
                {
                    _id : '钣金',
                    name: '钣金'
                }, {
                    _id : '喷涂',
                    name: '喷涂'
                }
            ];
            
            this.render();
        },

        showDatePicker: function () {
            var $createDatePicker = $('.createFormDatepicker');

            if ($createDatePicker.find('.arrow').length === 0) {
                $createDatePicker.append('<div class="arrow"></div>');
            }
        },

        saveItem: function () {
            var self = this;
            var mid = 39;
            var projectId = this.$el.find('#projectId').attr('data-id');
            var orderNumber = this.$el.find('#orderNumber').attr('data-id');
            //var produceType = $.trim(this.$el.find('#produceType').val());
            var produceType = $.trim(this.$el.find('#produceType').text());
            var insertDate = $.trim(this.$el.find('#insertDate').val());

            this.model.save(
                {
                    projectId     : projectId,
                    orderNumber   : orderNumber,
                    produceType   : produceType,
                    insertDate    : insertDate
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        Backbone.history.navigate('easyErp/produceSchedule', {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            var holder = $target.parents('._modalSelect').find('.current-selected');

            if(holder.attr('id') === 'projectId'){
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                var opid = this.$el.find('#projectId').data('id');

                dataService.getData('/produceSchedule/getOrderNumber', {_id: opid}, function (orderNumbers, context) {
                    orderNumbers = _.map(orderNumbers.data, function (orderNumber) {
                        orderNumber.name = orderNumber._id;
                        return orderNumber;
                    });
                    context.responseObj['#orderNumber'] = orderNumbers;
                }, this);
            }
            else{
                holder.text($target.text()).attr('data-id', $target.attr('id'));
            }
        },

        render: function () {
            var formString = this.template();
            var self = this;
            var filterHash;
            var filter;
            var $notDiv;
            var $thisEl;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog',
                width        : 800,
                title        : 'Create produceSchedule',
                buttons      : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }
                }
            });

            dataService.getData('/building/getBuildings', {}, function (buildings) {
                buildings = _.map(buildings.data, function (building) {
                    building.name = building.name;

                    return building;
                });

                self.responseObj['#projectId'] = buildings;
            });

            /*dataService.getData('/workCentre/getForDd', {}, function (workCentres) {
                workCentres = _.map(workCentres.data, function (workCentre) {
                    workCentre.name = workCentre.name;

                    return workCentre;
                });

                self.responseObj['#produceType'] = workCentres;
            });*/

            this.$el.find('#insertDate').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : '2',
                minDate    : '1'
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
