/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Backbone',
    'Underscore',
    'text!templates/depRoyalty/list/ListTemplate.html'
], function (Backbone, _, ListTemplate) {
    var ListItemView = Backbone.View.extend({
        el: '#listTable',


        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            this.$el.append(_.template(ListTemplate, {
                Collection: this.collection.toJSON()
            }));
        }
    });

    return ListItemView;
});
