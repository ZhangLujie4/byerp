define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/scanlogs/CreateTemplate.html',
    'models/ScanlogsModel',
    'common',
    'populate',
    'dataService',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants'
], function (Backbone, $, _, ParentView, CreateTemplate, ScanlogsModel, common, populate, dataService, AttachView, SelectView, CONSTANTS) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'scanlogs',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'      : 'showDatePicker',
            'change #workflowNames': 'changeWorkflows',
        },

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new ScanlogsModel();
            
            this.render();
        },

        clickInput: function () {
            this.$el.find('.input-file .inputAttach').click();
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
            var barId = this.$el.find('#barId').attr('data-id');
            var workCentre = this.$el.find('#workCentre').attr('data-id');
            var workGroup = this.$el.find('#workGroup').attr('data-id');
            var scantime = $.trim(this.$el.find('#scantime').val());
            var uploadtime = $.trim(this.$el.find('#uploadtime').val());
            var note = $.trim(this.$el.find('#note').val());

            this.model.save(
                {
                    barCode       : barId,
                    workCentre    : workCentre,
                    workGroup     : workGroup,
                    scantime      : scantime,
                    uploadtime    : uploadtime,
                    note          : note
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        Backbone.history.navigate('easyErp/scanlogs', {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('._modalSelect').find('.current-selected');

            holder.text($target.text()).attr('data-id', $target.attr('id'));
            
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
                title        : 'Create scanlogs',
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

            dataService.getData('/barCode/getById', {}, function (barCodes) {
                barCodes = _.map(barCodes.data, function (barCode) {
                    barCode.name = barCode.barId;

                    return barCode;
                });
                self.responseObj['#barId'] = barCodes;
            });

            dataService.getData('/workCentre/getForDd', {}, function (workCentres) {
                workCentres = _.map(workCentres.data, function (workCentre) {
                    workCentre.name = workCentre.name;

                    return workCentre;
                });

                self.responseObj['#workCentre'] = workCentres;
            });

            dataService.getData('/plantWorkGroup/getById', {}, function (plantWorkGroups) {
                plantWorkGroups = _.map(plantWorkGroups.data, function (plantWorkGroup) {
                    delete plantWorkGroup.status;
                    plantWorkGroup.name = plantWorkGroup.groupId;
                    return plantWorkGroup;
                });

                self.responseObj['#workGroup'] = plantWorkGroups;
            });

            this.$el.find('#scantime').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });

            this.$el.find('#uploadtime').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
