define([
    'Backbone',
    'Underscore',
    'text!templates/aluveneerOrders/list/ListTemplate.html',
    'text!templates/aluveneerOrders/listInfo/ListTemplate.html'
], function (Backbone, _, ListTemplate, ListInfoTemplate) {
    var AluveneerOrdersListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            //this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize;// Counting the start index of list items
        },

        render: function () {
            var model=this.collection.toJSON()||[];
            if(model.length > 0 && model[0].lbmc){
                this.$el.append(_.template(ListInfoTemplate, {
                    aluveneerOrdersCollection: this.collection.toJSON(),
                    //startNumber    : this.startNumber
                }));
            }
            else{
                this.$el.append(_.template(ListTemplate, {
                    aluveneerOrdersCollection: this.collection.toJSON(),
                    //startNumber    : this.startNumber
                }));
            }
        }
    });

    return AluveneerOrdersListItemView;
});
