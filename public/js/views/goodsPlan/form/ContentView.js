define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/tformViewBase',
    'text!templates/goodsPlan/form/ContentTemplate.html',
    'text!templates/goodsPlan/form/ListItemTemplate.html',
    'models/goodsPlanModel',
    'views/goodsPlan/CreateView',
    'views/goodsPlan/form/FormView',
    'views/goodsPlan/form/EditView',
    'constants',
    'helpers',
    'common'
], function(Backbone, $, _, TFormBaseView, ContentTemplate, ListItemTemplate, goodsPlanModel, CreateView, FormView, EditView, CONSTANTS, helpers, common) {
    'use strict';

    var goodsPlanListView = TFormBaseView.extend({
        listTemplate: _.template(ListItemTemplate),
        contentTemplate: _.template(ContentTemplate),
        CreateView: CreateView,
        EditView: EditView,
        listUrl: 'easyErp/goodsPlan/list/',
        contentType: CONSTANTS.GOODSPLAN,
        viewType: 'tform',
        hasPagination: true,
        hasAlphabet: false,
        formView: null,
        forSales: false,
        selectedId: null,
        ContentModel: goodsPlanModel,
        FormView: FormView,

        renderList: function(orders) {
            var $thisEl = this.$el;
            var $listHolder = $thisEl.find('#listContent');

            $listHolder.append(this.listTemplate({
                orders: orders,
                common: common
            }));
        },

        renderFormView: function(modelId, cb) {
            var $thisEl = this.$el;
            var self = this;
            var model;

            model = new this.ContentModel();

            model.urlRoot = '/goodsPlan/' + modelId;
            model.fetch({
                success: function(model) {
                    if (self.formView) {
                        self.formView.undelegateEvents();
                    }

                    self.currentModel = model;

                    self.formView = new self.FormView({ model: model, el: '#formContent' });
                    self.formView.render();

                    $thisEl.find('#listContent .selected').removeClass('selected');
                    $thisEl.find('tr[data-id="' + modelId + '"]').addClass('selected');

                    self.selectedId = model.id;

                    if (cb && typeof cb === 'function') {
                        cb();
                    }
                },

                error: function() {
                    App.render({
                        type: 'error',
                        message: '服务器错误'
                    });
                }
            });
        }
    });

    return goodsPlanListView;
});