define([
    'Backbone',
    'Underscore',
    'text!templates/DesignBook/list/ListTemplate.html'
], function (Backbone, _, listTemplate) {
    var projectsListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            this.$el.append(_.template(listTemplate, {
                projectsCollection: this.collection.toJSON()
            }));
        }
    });

    return projectsListItemView;
});
