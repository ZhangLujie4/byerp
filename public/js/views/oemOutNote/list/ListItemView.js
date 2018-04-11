define([
    'Backbone',
    'Underscore',
    'text!templates/oemOutNote/list/ListTemplate.html',
    'moment'
], function (Backbone, _, shippingNoteListTemplate, moment) {
    'use strict';

    var shippingNoteListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            this.$el.append(_.template(shippingNoteListTemplate, {
                shippingNoteCollection: this.collection.toJSON(),
                moment: moment
            }));
        }
    });

    return shippingNoteListItemView;
});
