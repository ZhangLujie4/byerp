define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/Departments/TopBarTemplate.html'
], function (_, BaseView, ContentTopBarTemplate) {
    'use strict';
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'Departments',
        headerType : '部门',
        template   : _.template(ContentTopBarTemplate)
    });
    return TopBarView;
});
