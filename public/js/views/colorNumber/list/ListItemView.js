define([
    'Backbone',
    'Underscore',
    'text!templates/colorNumber/list/ListTemplate.html'
], function (Backbone, _, ListTemplate) {
    var ColorNumberListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            
        },

        render: function () {
            this.$el.append(_.template(ListTemplate, {
                colorNumberCollection: this.collection.toJSON(),
                //startNumber    : this.startNumber
            }));
            
        }
    });

    return ColorNumberListItemView;
});
