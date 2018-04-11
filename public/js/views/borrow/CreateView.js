define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/borrow/CreateTemplate.html',
    'models/borrowModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants',
    'dataService'
], function (Backbone, $, _, ParentView, CreateTemplate, AcceptModel, common, populate, AttachView, SelectView, CONSTANTS,dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'bank',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #pmr li:not(.miniStylePagination)': 'changePmr',
            'click #deadline'      : 'showDatePicker',
        },


        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            var self=this;
            this.model = new AcceptModel();

            dataService.getData(CONSTANTS.URLS.BORROW_GETPMR, {
            }, function (result) {

                self.responseObj['#pmr'] = result.data[0].pmr;

                self.render();

            });
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var id = $target.attr('id');
            var text = $target.text();
            var $ul = $target.closest('ul');
            var $element = $ul.closest('dd').find('a');

            $element.attr('data-id', id);
            $element.text(text);

            $ul.remove();
            return false;
        },

        changePmr :function () {
            var pmr=$.trim(this.$el.find('#pmr').attr('data-id'));
            var self=this;
            dataService.getData(CONSTANTS.URLS.BORROW_GETPROJECTBYPMR , {
                id:pmr
            }, function (result) {
                self.responseObj['#project'] = result;

            });
        },

        saveItem: function () {
            var self = this;
            var mid = 56;
            var thisEl = this.$el;

            var pmr=$.trim(this.$el.find('#pmr').attr('data-id'));
            var project=$.trim(this.$el.find('#project').attr('data-id'));
            var amount = $.trim(this.$el.find('#amount').val());
            var day = $.trim(this.$el.find('#day').val());
            var targetDate = $.trim(this.$el.find('#targetDate').val());
            var rate1 = $.trim(this.$el.find('#rate1').val());
            var rate2 = $.trim(this.$el.find('#rate2').val());
            var rate3 = $.trim(this.$el.find('#rate3').val());


            this.model.save(
                {
                    pmr:pmr,
                    project:project,
                    amount:amount,
                    day:day,
                    targetDate:targetDate,
                    rate1:rate1,
                    rate2:rate2,
                    rate3:rate3,
                    examine:'未审核'
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        var url = window.location.hash;

                        Backbone.history.fragment = '';

                        Backbone.history.navigate(url, {trigger: true});

                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
        },

        render: function () {
            var formString = this.template();
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog task-edit-dialog',
                width        : 800,
                title        : 'Create Task',
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
            this.$el.find('#day').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : 0
            }).datepicker('setDate', new Date());

            this.$el.find('#targetDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            });
            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
