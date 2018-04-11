define([
    'Backbone',
    'Underscore',
    'text!templates/ProjectFund/list/ListTemplate.html',
    'moment',
    'text!templates/ProjectFund/PmrDetailList/ListTemplate.html',
    'text!templates/ProjectFund/projectDetailList/ListTemplate.html'
], function (Backbone, _, ListTemplate,moment,pmrListTemplate,projectListTemplate) {
    var ProjectFundListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
        },

        render: function () {
            var model=this.collection.toJSON();
            if(model[0].project) {
                model.splice(0,1);
                this.$el.append(_.template(pmrListTemplate, {
                    collection: model
                }));
            }else if(model[0].invoice){
                model.splice(0,1);
                this.$el.append(_.template(projectListTemplate, {
                    collection: model,
                    moment:moment
                }));
            } else{
                this.$el.append(_.template(ListTemplate, {
                    collection: this.collection.toJSON()
                }));
            }
        }
    });

    return ProjectFundListItemView;
});
