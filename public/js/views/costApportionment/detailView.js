define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/costApportionment/detail.html',
    'moment'
], function (Backbone,
             _,
             $,
             ParentView,
             detail,
             moment
) {

    var EditView = ParentView.extend({
        contentType: 'costApportionment',
        template   : _.template(detail),
        events: {
        },
        responseObj: {},


        initialize: function (options) {
            _.bindAll(this, 'render');
            console.log(options)
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.type=options.type;
            this.render();
        },

        hideDialog: function () {
            $('.detail-dialog').remove();
        },

        render: function () {
            var model=this.currentModel;
            var mergeList=model.details;
            var formString = this.template({
                model:model,
                aluList:mergeList,
                journalEntryList:mergeList,
                orderRowList:mergeList,
                scanList:mergeList,
                sprayList:mergeList,
                materialsList:mergeList,
                shippingList:mergeList,
                type:this.type,
                moment:moment
            });

            var self = this;

            this.$el = $(formString).dialog({
                dialogClass: 'detail-dialog',
                width: 1100,
                buttons: {

                    cancel: {
                        text: '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }

                }
            });

            this.delegateEvents(this.events);


            return this;
        }

    });
    return EditView;
});
