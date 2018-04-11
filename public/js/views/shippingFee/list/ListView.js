define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'views/selectView/selectView',
    'text!templates/shippingFee/list/ListHeader.html',
    'views/shippingFee/list/ListItemView',
    'constants',
    'populate',
    'moment',
    'models/shippingNoteModel',
    'custom'
], function (Backbone, $, _, ListViewBase, SelectView,listTemplate, ListItemView,CONSTANTS, populate, moment,shippingNoteModel,custom) {
    var workPointListView = ListViewBase.extend({
        listTemplate: listTemplate,
        ListItemView: ListItemView,
        contentType : CONSTANTS.SHIPPINGFEE,
        
        initialize: function (options) {
            var dateRange;
            this.startTime = options.startTime;
            this.collection = options.collection;
             this.filter = options.filter || custom.retriveFromCash('shippingFee.filter');

            if (!this.filter) {
                this.filter = {};
            }

            dateRange = this.filter.date ? this.filter.date.value : [];

            if (!this.filter.date) {
                this.filter.date = {
                    key  : 'date',
                    value: [new Date(dateRange.startDate), new Date(dateRange.endDate)]
                };
            }

            options.filter = this.filter;

            this.startDate = new Date(dateRange[0]);
            this.endDate = new Date(dateRange[1]);

          

            custom.cacheToApp('shippingFee.filter', this.filter);
            

            ListViewBase.prototype.initialize.call(this, options);
        },
        
        changeDateRange: function () {
            var itemsNumber = $('#itemsNumber').text();
            var stDate = $('#startDate').val();
            var enDate = $('#endDate').val();
            var searchObject;

            this.startDate = new Date(stDate);
            this.endDate = new Date(enDate);

            if (!this.filter) {
                this.filter = {};
            }

            this.filter.date = {
                value: [this.startDate, this.endDate]
            };

            searchObject = {
                page     : 1,
                filter   : this.filter
            };

            this.collection.getFirstPage(searchObject);
            this.changeLocationHash(1, itemsNumber, this.filter);

            App.filtersObject.filter = this.filter;

            custom.cacheToApp('shippingFee.filter', this.filter);
        },
        
        render: function () {
            var $currentEl;

            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate)({}));

            $currentEl.append(new ListItemView({
                collection: this.collection,                
            }).render());
            this.renderPagination($currentEl, this);
            return this;
        }
    });

    return workPointListView;
});
