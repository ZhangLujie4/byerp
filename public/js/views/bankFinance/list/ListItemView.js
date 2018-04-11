define([
    'Backbone',
    'Underscore',
    'text!templates/bankFinance/list/ListTemplate.html',
    'moment'
], function (Backbone, _, ListTemplate,moment) {
    var acceptListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            this.thisday=moment(options.toDay).format('YYYY-MM-DD');
        },

        render: function () {
            var model=this.collection.toJSON();
            for(var i=0;i<model.length;i++){
                model[i].journal.date=moment(model[i].journal.date).format('YYYY-MM-DD');
            }
            this.$el.append(_.template(ListTemplate, {
                tasksCollection: this.collection.toJSON(),
                toDay:this.thisday
            }));
        }
    });

    return acceptListItemView;
});
