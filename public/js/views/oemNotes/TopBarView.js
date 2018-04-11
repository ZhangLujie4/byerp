define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/oemNotes/TopBarTemplate.html',
    'custom',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, Custom, CONSTANTS) {
    'use strict';

    var TopBarView = BaseView.extend({
        el           : '#top-bar',
        contentType  : 'oemNotes',
        contentHeader: '来料出入库明细',
        template     : _.template(ContentTopBarTemplate)
    });

    return TopBarView;
});
