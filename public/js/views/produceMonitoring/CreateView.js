define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/produceMonitoring/CreateTemplate.html',
    'models/ProduceMonitoringModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'dataService',
    'constants'
], function (Backbone, $, _, ParentView, CreateTemplate, ProduceMonitoringModel, common, populate, AttachView, SelectView, dataService, CONSTANTS) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'produceMonitoring',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'      : 'showDatePicker',
        },

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new ProduceMonitoringModel();           
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
            var chooseDay = this.$el.find('#days').attr('data-id');

            this.model.save(
                {
                    chooseDay  : chooseDay
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        Backbone.history.navigate('easyErp/produceMonitoring', {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                }
            );
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        render: function () {
            var formString = this.template();
            var self = this;
            var filterHash;
            var filter;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog',
                width        : 600,
                title        : 'Create ProduceMonitoring',
                buttons      : {
                    save: {
                        text : '生成日报表',
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

            dataService.getData('/produceMonitoring/getDays', {}, function (days) {
                temps = _.map(days.data, function (temp) {
                    temp.name = temp.days;
                    temp._id = temp.datekey;
                    return temp;
                });

                self.responseObj['#days'] = temps;
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
