define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/tformViewBase',
    'text!templates/goodsInNotes/form/ContentTemplate.html',
    'text!templates/goodsInNotes/form/ListItemTemplate.html',
    'views/goodsInNotes/form/FormView',
    'models/goodsInNotesModel',
    'text!templates/goodsInNotes/form/FormTemplate.html',
    'views/goodsInNotes/list/ListItemView',
    'views/Filter/filterView',
    'helpers',
    'common',
    'moment',
    'constants'
], function (Backbone, $, _, TFormBaseView, ContentTemplate, ListItemTemplate, FormView, GoodsOutModel, formTemplate, ListItemView, FilterView, helpers, common, moment, CONSTANTS) {
    'use strict';

    var StockCorrectionsView = TFormBaseView.extend({
        listTemplate   : _.template(ListItemTemplate),
        contentTemplate: _.template(ContentTemplate),
        ListItemView   : ListItemView,
        listUrl        : 'easyErp/goodsInNotes/list/',
        contentType    : CONSTANTS.GOODSINNOTES,
        viewType       : 'tform',
        hasPagination  : true,
        hasAlphabet    : false,
        formView       : null,
        selectedId     : null,
        ContentModel   : GoodsOutModel,
        FormView       : FormView,

        renderList     : function (collection) {
            var $thisEl = this.$el;
            var $listHolder = $thisEl.find('#listContent');

            $listHolder.append(this.listTemplate({
                collection        : collection,
                common            : common
            }));
        },

        /*renderFormView: function (modelId, cb) {
            var self = this;
            var model;

            model = new this.ContentModel();

            model.fetch({
                data: {
                    id: modelId
                }
            },{
                success: function (model) {

                    if (self.formView) {
                        self.formView.undelegateEvents();
                    }

                    self.currentModel = model;
                    self.formView = new self.FormView({
                        model: model,
                        el   : '#formContent'
                    });
                    self.formView.render();

                    self.selectItem(modelId);

                    self.listenTo(self.formView, 'itemChanged', self.changeList);
                    self.selectedId = model.id || model.get('model')._id; //TODO change

                    if (cb && typeof cb === 'function') {
                        cb();
                    }
                },

                error: function () {
                    App.render({
                        type   : 'error',
                        message: 'Server error'
                    });
                }
            });
        }*/
    });

    return StockCorrectionsView;
});