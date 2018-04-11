define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/tformViewBase',
    'text!templates/projectRoyalty/form/ContentTemplate.html',
    'text!templates/projectRoyalty/form/ListItemTemplate.html',
    'views/projectRoyalty/form/FormView',
    'models/projectRoyaltyModel',
    'text!templates/projectRoyalty/form/FormTemplate.html',
    'views/projectRoyalty/list/ListItemView',
    'views/Filter/filterView',
    'helpers',
    'common',
    'constants',
    'dataService'
], function (Backbone, $, _, TFormBaseView, ContentTemplate, ListItemTemplate, FormView, Model, formTemplate, ListItemView, FilterView, helpers, common, CONSTANTS,dataService) {
    'use strict';

    var View = TFormBaseView.extend({
        listTemplate   : _.template(ListItemTemplate),
        contentTemplate: _.template(ContentTemplate),
        ListItemView   : ListItemView,
        listUrl        : 'easyErp/projectRoyalty/list/',
        contentType    : CONSTANTS.PROJECTROYALTY,
        viewType       : 'tform',
        hasPagination  : false,
        hasAlphabet    : false,
        formView       : null,
        selectedId     : null,
        ContentModel   : Model,
        FormView       : FormView,

        renderList     : function (collection) {

        },

        renderFormView: function (modelId, cb) {

            var self = this;

            dataService.getData('/projectRoyalty/getContractInfo', {
                id:modelId
            }, function (resp) {

                self.formView = new self.FormView({model: resp, el: '#formContent'});
                self.formView.render();
            });
            /*model.fetch({
                data   : data,
                success: function (model) {

                    if (self.formView) {
                        self.formView.undelegateEvents();
                    }

                    self.currentModel = model;

                    self.formView = new self.FormView({model: model, el: '#formContent'});
                    self.formView.render();

                    $thisEl.find('#listContent .selected').removeClass('selected');
                    $thisEl.find('tr[data-id="' + modelId + '"]').addClass('selected');

                    self.selectedId = model.id;

                    if (cb && typeof cb === 'function') {
                        cb();
                    }
                },

                error: function () {

                    App.render({
                        type   : 'error',
                        message: '服务器错误'
                    });
                }
            });*/
        }
    });

    return View;
});