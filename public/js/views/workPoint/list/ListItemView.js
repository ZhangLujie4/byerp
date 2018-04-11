define([
    'Backbone',
    'Underscore',
    'text!templates/workPoint/list/ListTemplate.html'
], function (Backbone, _, workPointListTemplate) {
    'use strict';

    var workPointListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            this.$el.append(_.template(workPointListTemplate, {
                workPointCollection: this.collection.toJSON()
            }));
        }
    });

    return workPointListItemView;
});
