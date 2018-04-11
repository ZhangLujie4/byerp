define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/oemOrders/form/FormTemplate.html',
    'text!templates/oemOrders/temps/documentTemp.html',
    'views/NoteEditor/NoteView',
    'views/Editor/AttachView',
    'common',
    'custom',
    'dataService',
    'populate',
    'constants',
    'helpers',
    'services/showJournalEntries'
], function (Backbone, $, _, ParentView, EditTemplate, DocumentTemplate, NoteEditor, AttachView, common, Custom, dataService, populate, CONSTANTS, helpers, journalService) {

    var FormView = ParentView.extend({
        contentType: 'oemOrders',
        imageSrc   : '',
        template   : _.template(EditTemplate),
        forSales   : false,
        service    : false,
        templateDoc: _.template(DocumentTemplate),

        initialize: function (options) {
            var modelObj;

            if (options) {
                this.visible = options.visible;
            }

            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = '/oemOrders';
            this.responseObj = {};
            // this.editablePrice = this.currentModel.get('workflow').status === 'New' || false;
            this.warehouse = this.currentModel.get('warehouse');
            this.editable = options.editable || true;
            this.balanceVissible = false;
            modelObj = this.currentModel.toJSON();
            this.onlyView = (modelObj.workflow && modelObj.workflow.status === 'Done');
        },

        events: {
            'click #resetPrices'       : 'resetPrices',
            'click .saveBtn'           : 'saveOrder',
            'click #attachment_file'   : 'clickInput',
            'click #viewJournalEntries': journalService.showForDocs
        },

        checkActiveClass: function (e) {
            var $target = $(e.target);

            if ($target.closest('li').hasClass('activeItem')) {
                return true;
            }

            return false;
        },

        render: function () {
            var self = this;
            var $thisEl = this.$el;
            var formString;
            var template;
            var timeLine;

            this.template = _.template(EditTemplate);

            formString = this.template({
                model   : this.currentModel.toJSON(),
                visible : this.visible,
                onlyView: this.onlyView,
                forSales: this.forSales
            });

            $thisEl.html(formString);

            template = this.templateDoc({
                model           : this.currentModel.toJSON(),
                currencySplitter: helpers.currencySplitter,
                addressMaker    : helpers.addressMaker
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
                    contentType: 'order',
                    forDoc     : true
                }).render().el
            );

            $('.blue').hide();

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
