define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/colorNumber/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'common',
    'populate',
    'dataService',
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
             populate,
             dataService,
             custom,
             CONSTANTS) {

    var EditView = ParentView.extend({
        contentType: 'ColorNumber',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.COLORNUMBER;

            self.eventChannel = options.eventChannel;          

            this.render(options);
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var endElem = target.parents('dd').find('.current-selected');

            endElem.text(target.text()).attr('data-id', target.attr('id'));
            endElem.attr('data-shortdesc', target.data('level'));
        },

        saveItem: function (event) {
            var mid = 39;
            var self = this;
            var model;
            var $currentEl = this.$el;
            var colorNumber = $.trim($currentEl.find('#colorNumber').val());

            var data = {
                colorNumber  : colorNumber,
            };

            event.preventDefault();

            //this.currentModel.set(data);

            this.currentModel.save(data, {               
                headers: {
                    mid: mid
                },
                patch  : true,

                success: function () {
                    self.hideDialog();
                    Backbone.history.navigate('easyErp/colorNumber', {trigger: true});
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

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 600,
                title      : 'edit colorNumber',
                buttons    : {
                    save: {
                        text : '保存',
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

            dataService.getData('/building/getBuildings', {}, function (opportunities) {
                opportunities = _.map(opportunities.data, function (opportunitie) {
                    opportunitie.name = opportunitie.name;

                    return opportunitie;
                });

                self.responseObj['#projectId'] = opportunities;
            });

            this.renderAssignees(this.currentModel);

            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
