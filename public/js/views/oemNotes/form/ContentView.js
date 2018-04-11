define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/tformViewBase',
    'text!templates/oemNotes/form/ContentTemplate.html',
    'text!templates/oemNotes/form/ListItemTemplate.html',
    'views/oemNotes/form/FormView',
    'models/oemNotesModel',
    'views/oemNotes/list/ListItemView',
    'views/Filter/filterView',
    'helpers',
    'common',
    'moment',
    'constants'
], function (Backbone, $, _, TFormBaseView, ContentTemplate, ListItemTemplate, FormView, OemNotesModel, ListItemView, FilterView, helpers, common, moment, CONSTANTS) {
    'use strict';

    var OemNotesView = TFormBaseView.extend({
        listTemplate   : _.template(ListItemTemplate),
        contentTemplate: _.template(ContentTemplate),
        ListItemView   : ListItemView,
        listUrl        : 'easyErp/oemNotes/list/',
        contentType    : 'oemNotes',
        viewType       : 'tform',
        hasPagination  : true,
        hasAlphabet    : false,
        formView       : null,
        selectedId     : null,
        ContentModel   : OemNotesModel,
        FormView       : FormView,

        renderList     : function (collection) {
            var $thisEl = this.$el;
            var $listHolder = $thisEl.find('#listContent');

            $listHolder.append(this.listTemplate({
                collection        : collection,
                common            : common
            }));
        },

    });

    return OemNotesView;
});