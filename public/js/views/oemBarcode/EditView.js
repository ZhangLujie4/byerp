define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/oemBarcode/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Editor/AttachView',
    'common',
    'dataService',
    'populate',
    'custom',
    'constants'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             selectView,
             NoteView,
             AttachView,
             common,
             dataService,
             populate,
             custom,
             CONSTANTS) {

    var EditView = ParentView.extend({
        contentType: 'oemBarcode',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.OEMBARCODE;

            self.eventChannel = options.eventChannel;

            this.render(options);
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var endElem = target.parents('._modalSelect').find('.current-selected');

            endElem.text(target.text()).attr('data-id', target.attr('id'));

        },

        saveItem: function (event) {
            var mid = 39;
            var self = this;
            var model;
            var $currentEl = this.$el;            

            var handlOpinion = $.trim(this.$el.find('#handlOpinion').val());
            var url = window.location.hash.split('/');
            
            var data = {
                handlOpinion  : handlOpinion,
                writeOffsId   : url[3]
            };

            event.preventDefault();

            //this.currentModel.set(data);

            this.currentModel.save(data, {               
                headers: {
                    mid: mid
                },
                patch  : true,

                success: function () {
                    url = window.location.hash;
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(url, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },

        render: function (options) {
            var formString = this.template({
                model: this.currentModel.toJSON()
            });
            var self = this;
            var notDiv;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 800,
                title      : 'edit oemBarcode',
                buttons    : {
                    save: {
                        text : '提交',
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


            this.renderAssignees(this.currentModel);

            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
