define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/dailyReport/form/FormTemplate.html',
     'text!templates/dailyReport/temps/documentTemp.html',
    'dataService',
    'constants',
    'helpers',
    //'services/showJournalEntries'
], function (Backbone, $, _, ParentView, EditTemplate, DocumentTemplate, dataService, CONSTANTS, helpers) {

    var FormView = ParentView.extend({
        contentType: CONSTANTS.DAILYREPORT,
        imageSrc   : '',
        template   : _.template(EditTemplate),
        templateDoc: _.template(DocumentTemplate),

        initialize: function (options) {
            var modelObj;

             if (options) {
                 this.visible = options.visible;
             }

            this.eventsChannel = App.eventsChannel || _.extend({}, Backbone.Events);

            this.listenTo(this.eventsChannel, 'createdPaymentMethod', this.reloadPage);

            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = '/dailyReport';
            this.responseObj = {};
            this.editable = options.editable || true;
            modelObj = this.currentModel.toJSON();
            this.onlyView = (modelObj.status == 'new')? false : true;
        },

        events: {
             'click .saveBtn'            : 'saveDailyReport'
        },

        reloadPage: function () {
            var url = window.location.hash;
            Backbone.history.fragment = '';
            Backbone.history.navigate(url, {trigger: true});
        },

        render: function () {
            var self = this;
            var $thisEl = this.$el;
            var formString;
            var buttons;
            var template;

            if (!this.onlyView) {
                buttons = [
                    {
                        text : '保存',
                        class: 'btn blue',
                        click: function () {
                            self.saveItem();
                        }
                    }, {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }, {
                        text : '删除',
                        class: 'btn',
                        click: self.deleteItem
                    }
                ];
            } else {
                buttons = [
                    {
                        text : '关闭',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }
                ];
            }

            this.template = _.template(EditTemplate);

            formString = this.template({
                model             : this.currentModel.toJSON(),
                visible           : this.visible,
                onlyView          : this.onlyView,
                //forSales          : this.forSales,
                dialog            : this.dialog,
                unlinkedWorkflowId: CONSTANTS.DEFAULT_UNLINKED_WORKFLOW_ID
            });

            if (!this.dialog) {
                $thisEl.html(formString);

                console.log(this.currentModel.toJSON());
                template = this.templateDoc({
                    model           : this.currentModel.toJSON()
                });

                $thisEl.find('#templateDiv').html(template);


            } else {
                this.$el = $(formString).dialog({
                    autoOpen   : true,
                    dialogClass: 'edit-dialog',
                    title      : 'Edit dailyReport',
                    width      : '1100px',
                    buttons    : buttons
                });

                this.$el.find('.saveBtn').remove();
            }

            this.delegateEvents(this.events);

            return this;
        }

    });

    FormView.extend = function (childView) {
        var view = Backbone.View.extend.apply(this, arguments);

        view.prototype.events = _.extend({}, this.prototype.events, childView.events);

        return view;
    };

    return FormView;
});
