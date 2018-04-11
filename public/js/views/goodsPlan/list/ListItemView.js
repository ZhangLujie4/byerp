define([
    'Backbone',
    'Underscore',
    'text!templates/goodsPlan/list/ListTemplate.html',
    'helpers',
    'constants',
    'common'
], function (Backbone, _, listTemplate, helpers, CONSTANTS, common) {
    var OrderListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize;
        },

        render: function () {
            this.$el.append(_.template(listTemplate, {
                orderCollection   : this.collection.toJSON(),
                startNumber       : this.startNumber,
                unlinkedWorkflowId: CONSTANTS.DEFAULT_UNLINKED_WORKFLOW_ID,
                common            : common
            }));
        }
    });

    return OrderListItemView;
});
