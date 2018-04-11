define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/produceMonitoring/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'dataService'
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
             dataService) {

    var EditView = ParentView.extend({
        contentType: 'produceMonitoring',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            //this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentId = options.dataId;
            this.chooseDay = options.chooseDay;
            //this.currentModel.urlRoot = CONSTANTS.URLS.PRODUCEMONITORING;
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
            var chargeItem = $.trim($currentEl.find('#chargeItem').val());
            var unit = $.trim($currentEl.find('#unit').val());
            var price = $.trim($currentEl.find('#price').val());
            var code = $.trim(this.$el.find('#code').val());

            var data = {
                chargeItem  : chargeItem,
                unit        : unit,
                price       : price,
                code        : code
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
                    Backbone.history.navigate('easyErp/produceMonitoring', {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },

        render: function (options) {
            var detailId = this.currentId;
            var chooseDay = this.chooseDay;

            dataService.getData('/produceMonitoring/getDetails', {id : detailId, chooseDay : chooseDay}, function (details,context) {
                var formString = context.template({
                    model: details.data
                });

                context.$el = $(formString).dialog({
                    dialogClass: 'edit-dialog',
                    width      : 1200,
                    title      : 'edit produceMonitoring',
                    buttons    : {
                        /*save: {
                            text : '保存',
                            class: 'btn blue',
                            click: self.saveItem
                        },*/

                        cancel: {
                            text : '关闭',
                            class: 'btn',
                            click: context.hideDialog
                        }
                    }
                });
                
            },this);

            
        }

    });
    return EditView;
});
