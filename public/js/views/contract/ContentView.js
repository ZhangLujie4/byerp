define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/contract/TabsTemplate.html',
    'collections/InternalContract/filterCollection',
    'collections/LabourContract/filterCollection',
    'collections/MachineContract/filterCollection',
    'collections/OutContract/filterCollection',
    'collections/PurchaseContract/filterCollection',
    'views/contract/InternalContract/ListView',
    'views/contract/LabourContract/ListView',
    'views/contract/MachineContract/ListView',
    'views/contract/OutContract/ListView',
    'views/contract/PurchaseContract/ListView'
], function ($,
             _,
             Backbone,
             Parent,
             TabsTemplate,
             InternalContractCollection,
             LabourContractCollection,
             MachineContractCollection,
             OutContractCollection,
             PurchaseContractCollection,
             InternalContractView,
             LabourContractView,
             MachineContractView,
             OutContractView,
             PurchaseContractView) {

    var SettingsContractListView = Parent.extend({
        el      : '#content-holder',
        template: _.template(TabsTemplate),

        initialize: function (options) {
            this.startTime = options.startTime;
            this.InternalContractCollection = new InternalContractCollection({
                viewType        : 'list',
                page            : 1,
                reset           : true,
                count           : 50,
                filter          : null,
                parrentContentId: null,
                contentType     : this.contentType,
                showMore        : false
            });

            this.LabourContractCollection = new LabourContractCollection({
                viewType        : 'list',
                page            : 1,
                reset           : true,
                count           : 50,
                filter          : null,
                parrentContentId: null,
                contentType     : this.contentType,
                showMore        : false
            });
           this.MachineContractCollection = new MachineContractCollection({
               viewType        : 'list',
               page            : 1,
               reset           : true,
               count           : 50,
               filter          : null,
               parrentContentId: null,
               contentType     : this.contentType,
               showMore        : false
           });
           this.OutContractCollection = new OutContractCollection({
               viewType        : 'list',
               page            : 1,
               reset           : true,
               count           : 50,
               filter          : null,
               parrentContentId: null,
               contentType     : this.contentType,
               showMore        : false
           });
           this.PurchaseContractCollection = new PurchaseContractCollection({
                viewType        : 'list',
                page            : 1,
                reset           : true,
                count           : 50,
                filter          : null,
                parrentContentId: null,
                contentType     : this.contentType,
                showMore        : false
            });


            this.InternalContractCollection.bind('reset', this.renderInternalContract, this);
            this.LabourContractCollection.bind('reset', this.renderLabourContract, this);
            this.MachineContractCollection.bind('reset', this.renderMachineContract, this);
            this.OutContractCollection.bind('reset', this.renderOutContract, this);
            this.PurchaseContractCollection.bind('reset', this.renderPurchaseContract, this);

            this.render();

            $('#top-bar').html('');
        },

        renderInternalContract: function () {
            new InternalContractView({
                collection: this.InternalContractCollection
            }).render();
        },

        renderLabourContract: function () {
            new LabourContractView({
                collection: this.LabourContractCollection
            }).render();
        },
        renderMachineContract: function () {
            new MachineContractView({
                collection: this.MachineContractCollection
            }).render();
        },
        renderOutContract: function () {
            new OutContractView({
                collection: this.OutContractCollection
            }).render();
        },
        renderPurchaseContract: function () {
            new PurchaseContractView({
                collection: this.PurchaseContractCollection
            }).render();
        },

        render: function () {
            var formString = this.template();

            this.$el.html(formString);

            return this;
        }

    });

    return SettingsContractListView;
});
