/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/tformViewBase',
    'text!templates/royaltyDetails/form/ContentTemplate.html',
    'text!templates/royaltyDetails/form/ListItemTemplate.html',
    'views/royaltyDetails/form/FormView',
    'models/royaltyDetailsModel',
    'text!templates/royaltyDetails/form/FormTemplate.html',
    'views/royaltyDetails/list/ListItemView',
    'views/Filter/filterView',
    'helpers',
    'common',
    'constants'
], function (Backbone, $, _, TFormBaseView, ContentTemplate, ListItemTemplate, FormView, Model, formTemplate, ListItemView, FilterView, helpers, common, CONSTANTS) {
    'use strict';

    var View = TFormBaseView.extend({
        listTemplate   : _.template(ListItemTemplate),
        contentTemplate: _.template(ContentTemplate),
        ListItemView   : ListItemView,
        listUrl        : 'easyErp/royaltyDetails/list/',
        contentType    : CONSTANTS.ROYALTYDETAILS,
        viewType       : 'tform',
        hasPagination  : true,
        hasAlphabet    : false,
        formView       : null,
        selectedId     : null,
        ContentModel   : Model,
        FormView       : FormView,

        renderList     : function (collection) {
            var $thisEl = this.$el;
            var $listHolder = $thisEl.find('#listContent');

            $listHolder.append(this.listTemplate({
                collection : collection,
                common     : common
            }));
        },
    });

    return View;
});
