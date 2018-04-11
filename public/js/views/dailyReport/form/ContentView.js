define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/tformViewBase',
    'text!templates/dailyReport/form/ContentTemplate.html',
    'text!templates/dailyReport/form/ListItemTemplate.html',
    'models/dailyReportModel',
    'views/dailyReport/CreateView',
    'views/dailyReport/form/FormView',
    'views/dailyReport/form/EditView',
    'constants',
    'helpers'
], function (Backbone, $, _, TFormBaseView, ContentTemplate, ListItemTemplate, DailyReportModel, CreateView, FormView, EditView, CONSTANTS, helpers) {
    'use strict';

    var DailyReportListView = TFormBaseView.extend({
        listTemplate   : _.template(ListItemTemplate),
        contentTemplate: _.template(ContentTemplate),
        CreateView     : CreateView,
        EditView       : EditView,
        listUrl        : 'easyErp/dailyReport/list/',
        contentType    : CONSTANTS.DAILYREPORT, // needs in view.prototype.changeLocationHash
        viewType       : 'tform', // needs in view.prototype.changeLocationHash
        hasPagination  : true,
        hasAlphabet    : false,
        formView       : null,
        selectedId     : null,
        ContentModel   : DailyReportModel,
        FormView       : FormView,

        renderList: function (dailyReports) {
            var $thisEl = this.$el;
            var $listHolder = $thisEl.find('#listContent');
            console.log("到这里了");
            $listHolder.append(this.listTemplate({
                dailyReports    : dailyReports
            }));
        },

        renderFormView: function (modelId, cb) {
            var $thisEl = this.$el;
            var self = this;
            var model;

            model = new this.ContentModel();

            model.urlRoot = '/dailyReport/' + modelId;

            model.fetch({
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
            });
        }
    });

    return DailyReportListView;
});
