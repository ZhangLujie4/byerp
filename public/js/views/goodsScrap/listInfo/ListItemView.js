define([
    'Backbone',
    'Underscore',
    'text!templates/goodsScrap/listInfo/ListTemplate.html',
], function (Backbone, _, ListTemplate) {
    var GoodsScrapListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            //this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize;// Counting the start index of list items
        },

        render: function () {
            
            this.$el.append(_.template(ListTemplate, {
                goodsScrapCollection: this.collection.toJSON(),
                //startNumber    : this.startNumber
            }));
        }
    });

    return GoodsScrapListItemView;
});
