define([
    'Backbone',
    'Underscore',
    'text!templates/produceMonitoring/list/ListTemplate.html',
    'text!templates/produceMonitoring/listInfo/ListTemplate.html'
], function (Backbone, _, ListTemplate, ListInfoTemplate) {
    var ProduceMonitoringListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            //this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize;// Counting the start index of list items
        },

        render: function () {
            var model=this.collection.toJSON()||[];
            if(model.length > 0 && model[0].workCentre){
                this.$el.append(_.template(ListInfoTemplate, {
                    produceMonitoringCollection: this.collection.toJSON(),
                    //startNumber    : this.startNumber
                }));
            }
            else{
                this.$el.append(_.template(ListTemplate, {
                    produceMonitoringCollection: this.collection.toJSON(),
                    //startNumber    : this.startNumber
                }));
            }
        }
    });

    return ProduceMonitoringListItemView;
});
