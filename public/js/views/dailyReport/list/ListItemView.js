define([
    'Backbone',
    'Underscore',
    'text!templates/dailyReport/list/ListTemplate.html'
], function (Backbone, _, dailyReportListTemplate) {
    'use strict';

    var dailyReportListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            this.$el.append(_.template(dailyReportListTemplate, {
                dailyReportCollection: this.collection.toJSON()
            }));
        }
    });

    return dailyReportListItemView;
});
