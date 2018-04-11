define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/projectApproval/kanban/KanbanItemTemplate.html',
    'moment',
    'helpers'
], function (Backbone, $, _, KanbanItemTemplate, moment, helpers) {
    'use strict';

    var OpportunitiesItemView = Backbone.View.extend({
        className: 'item',
        template : _.template(KanbanItemTemplate),
        id       : function () {
            return this.model.get('_id');
        },

        initialize: function (options) {
            this.date = moment(new Date());

            this.render(options);
        },

        render: function () {
            var model = this.model.toJSON();
            console.log(this.model.toJSON());
            this.$el.html(this.template(
                {
                    model           : this.model.toJSON(),
                    currencySplitter: helpers.currencySplitter
                }));

            if ((model.workflow.status !== 'Done') && (model.workflow.status !== 'Cancelled')) {
                if (model.expectedClosing && moment(new Date(model.expectedClosing)).isBefore(this.date)) {
                    this.$el.addClass('errorContent');
                }
                if (model.biderDate && moment(new Date(model.biderDate)).isBefore(this.date)) {
                    this.$el.addClass('errorContent');
                }
            }

            return this;
        }
    });

    return OpportunitiesItemView;
});
