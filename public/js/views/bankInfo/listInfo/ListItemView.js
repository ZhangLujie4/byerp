define([
    'Backbone',
    'Underscore',
    'text!templates/bankInfo/listInfo/ListTemplate.html',
    'moment'
], function (Backbone, _, ListTemplate,moment) {
    var acceptListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            var model;
            var models;
            var modelBank;
            var bank;
            var bankInfo;
            model=this.collection.toJSON();
            bank=model[0].bank;
            bankInfo=model[0].bankInfo;


            for(var i=0;i<bankInfo.length;i++){
                bankInfo[i].journal.date=moment(bankInfo[i].journal.date).format('YYYY-MM-DD');
            }


            this.$el.append(_.template(ListTemplate, {
                tasksCollection: bankInfo,
                bank: bank

            }));
        }
    });

    return acceptListItemView;
});
