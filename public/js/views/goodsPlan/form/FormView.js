define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/goodsPlan/form/FormTemplate.html',
    'text!templates/goodsPlan/temps/documentTemp.html',
    'views/NoteEditor/NoteView',
    'views/Editor/AttachView',
    'views/goodsPlan/form/PickView',
    'dataService',
    'constants',
    'helpers',
    'common'
], function (Backbone, $, _, ParentView, EditTemplate, DocumentTemplate, NoteEditor, AttachView, PickView,dataService, CONSTANTS, helpers, common) {

    var FormView = ParentView.extend({
        contentType: 'goodsPlan',
        imageSrc   : '',
        template   : _.template(EditTemplate),
        forSales   : true,
        service    : false,
        templateDoc: _.template(DocumentTemplate),

        initialize: function (options) {
            var modelObj;
            if (options) {
                this.visible = options.visible;
            }

            this.eventsChannel = App.eventsChannel || _.extend({}, Backbone.Events);

            this.listenTo(this.eventsChannel, 'createdPaymentMethod', this.reloadPage);

            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = '/goodsPlan';
            this.responseObj = {};
            this.warehouse = this.currentModel.get('warehouse');
            this.eventChannel = options.eventChannel;
            this.editable = options.editable || true;
            this.balanceVissible = false;
            modelObj = this.currentModel.toJSON();
            this.onlyView = (modelObj.workflow && modelObj.workflow.status === 'Done');
        },

        events: {
            'click #splitFulfil'        : 'splitFulfil',
            'click #allocateAll'        : 'allocateAll',
            'click .saveBtn'            : 'saveOrder',
            'click #pickButton'          : 'pickGoods',
            'keyup #allocated'         : 'changeAllocation',
            'keyup #fufilled'          : 'changedQuantity'
        },
        pickGoods:function(e){
            e.preventDefault();
            this.pickView = new PickView({model: this.currentModel, forSales: this.forSales});
            this.pickView.render();

        },

        render: function () {
            var self = this;
            var $thisEl = this.$el;
            var formString;
            var productItemContainer;
            var buttons;
            var template;
            var timeLine;

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
                forSales          : this.forSales,
                dialog            : this.dialog,
                unlinkedWorkflowId: CONSTANTS.DEFAULT_UNLINKED_WORKFLOW_ID
            });

            if (!this.dialog) {
                $thisEl.html(formString);

                template = this.templateDoc({
                    model     : this.currentModel.toJSON(),
                    common    : common
                });

                $thisEl.find('#templateDiv').html(template);

                timeLine = new NoteEditor({
                    model: this.currentModel
                });

                $thisEl.find('#historyDiv').html(
                    timeLine.render().el
                );

                $thisEl.find('#attachments').append(
                    new AttachView({
                        model      : this.currentModel,
                        contentType: 'goodsPlan',
                        forDoc     : true
                    }).render().el
                );

            } else {
                this.$el = $(formString).dialog({
                    autoOpen   : true,
                    dialogClass: 'edit-dialog',
                    title      : 'Edit Order',
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
