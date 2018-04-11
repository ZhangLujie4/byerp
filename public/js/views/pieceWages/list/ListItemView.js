define([
    'Backbone',
    'Underscore',
    'text!templates/pieceWages/list/ListTemplate.html',
    'text!templates/pieceWages/empList/ListTemplate.html',
    'text!templates/pieceWages/barList/ListTemplate.html'
], function (Backbone, _, ListTemplate, empListTemplate, barListTemplate) {
    var PieceWagesListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            //this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize;// Counting the start index of list items
        },

        render: function () {
            var model = this.collection.toJSON() || [];
            var type = model[0] || {};
            if(type.barCode){
                this.$el.append(_.template(barListTemplate, {
                    collection: model,
                    //startNumber    : this.startNumber
                }));
            }
            else if(type.price){
                this.$el.append(_.template(empListTemplate, {
                    collection: model
                    //startNumber    : this.startNumber
                }));
            }
            else{
                this.$el.append(_.template(ListTemplate, {
                    collection: model,
                    //startNumber    : this.startNumber
                }));
            }
            
            
        }
    });

    return PieceWagesListItemView;
});
