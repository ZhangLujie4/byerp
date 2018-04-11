define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/bankFinance/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'dataService',
    'moment'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             selectView,
             NoteView,
             AttachView,
             common,
             populate,
             custom,
             CONSTANTS,
             dataService,
             moment) {

    var EditView = ParentView.extend({
        contentType: 'Accept',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {

        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'saveItem', 'deleteItem');

            this.currentModel = (options.model) ? options.model : options.collection.getElement();

            this.currentModel.urlRoot = CONSTANTS.URLS.BANKFINANCE;
            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function (event) {
            var self = this;
           // var model=this.currentModel.toJSON();
            var mid;
            var data;
            var datas;
            event.preventDefault();
            mid = 39;
            var thisday;
            thisday=new(Date);
            var model;
            model=this.currentModel.toJSON();
            var date = thisday;
            var debit = $.trim(this.$el.find('#interest').val()) || 0;
            var account=model.account._id;
            var journal=$.trim(this.$el.find('#journal').attr('data-id'));

            datas={
                date:date,
                debit:0,
                credit:debit,
                account:account,
                journal:journal,
                state:"未到单",
                states:"未审核",
            };

            data = {
                restore:'已还原',
                datas:datas
            };

            this.currentModel.save(data, {
             headers: {
             mid: mid
             },
             patch  : true,
             success: function (model, res) {
                 model = model.toJSON();
                 $("tr[data-id='" + model._id + "'] td").remove();
                 var url = window.location.hash;

                 Backbone.history.fragment = '';

                 Backbone.history.navigate(url, {trigger: true});
             self.hideDialog();
             },

             error: function (model, xhr) {
             self.errorNotification(xhr);
             }
             });
        },

        deleteItem: function (event) {
            var mid;
            var self = this;
            var answer;
            event.preventDefault();

            mid=39;

            answer = confirm('Really DELETE items ?!');

            if (answer === true) {
                this.currentModel.destroy({
                    headers: {
                        mid: mid
                    },
                    success: function (model) {
                        model = model.toJSON();
                        console.log(123)
                        $("tr[data-id='" + model._id + "'] td").remove();
                        var url = window.location.hash;

                        Backbone.history.fragment = '';

                        Backbone.history.navigate(url, {trigger: true});

                        self.hideDialog();
                    },

                    error: function (model, xhr) {
                        console.log(123)
                        self.errorNotification(xhr);
                    }
                });
            }
        },

        render: function () {
            var model=this.currentModel.toJSON();
            model.journal.date=moment(model.journal.date).format('YYYY-MM-DD');
            var formString = this.template({
                model:model
            });

            var self = this;



            console.log(this.currentModel.toJSON())

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog  task-edit-dialog',
                width: 400,
                buttons: {
                    save: {
                        text: '还原',
                        class: 'btn blue',
                        click: self.saveItem
                    },
                    cancel: {
                        text: '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }
                }
            });
            populate.get('#journal', '/journals/getForDd', {}, 'name', this, false, true);
            this.$el.find('#day').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : 0
            }).datepicker('setDate', new Date());

            this.delegateEvents(this.events);


            return this;
        }

    });
    return EditView;
});
