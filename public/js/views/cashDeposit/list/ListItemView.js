define([
    'Backbone',
    'Underscore',
    'text!templates/cashDeposit/list/ListTemplate.html',
    'moment',
    'text!templates/cashDeposit/listInfo/ListTemplate1.html',
    'text!templates/cashDeposit/listInfo/ListTemplate2.html'
], function (Backbone, _, ListTemplate,moment,ListTemplateType1,ListTemplateType2) {
    var cashDepositListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            this.cashDepositType=options.cashDepositType;
            //this.startNumber = (parseInt(this.collection.currentPage, 10) - 1) * this.collection.pageSize;// Counting the start index of list items
        },

        render: function () {
            var template;
            var model=this.collection.toJSON();

            if(!this.cashDepositType){
                template=ListTemplate;
            }else if(this.cashDepositType=='tender'||this.cashDepositType=='salary'||this.cashDepositType=='deposit'||this.cashDepositType=='reputation'){
                template=ListTemplateType1
            }else{
                template=ListTemplateType2
            }
            this.$el.append(_.template(template, {
                tasksCollection: model
                //startNumber    : this.startNumber
            }));
        }
    });

    return cashDepositListItemView;
});
