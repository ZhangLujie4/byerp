define([
    'Backbone',
    'collections/parent',
    'models/goodsOutNotesModel',
    'constants',
    'custom'
], function (Backbone, Parent, GoodsOutModel, CONSTANTS, Custom) {
    var GoodsOutCollection = Parent.extend({
        model   : GoodsOutModel,
        url     : '/shippingPlan/',
        pageSize: CONSTANTS.DEFAULT_ELEMENTS_PER_PAGE,
        viewType: 'list',

        initialize: function (options) {
            var page;

            function _errHandler(models, xhr) {
                if (xhr.status === 401) {
                    Backbone.history.navigate('#login', {trigger: true});
                }
            }

            var dateRange;
            var startDate = new Date();
            var endDate = new Date();

            options = options || {};

            this.startTime = new Date();
            this.filter = options.filter || Custom.retriveFromCash('shippingPlan.filter');

            startDate.setMonth(0);
            startDate.setDate(1);
            endDate.setMonth(11);
            endDate.setDate(31);
            dateRange = Custom.retriveFromCash('shippingPlanDateRange') || {};

            this.startDate = dateRange.startDate || startDate;
            this.endDate = dateRange.endDate || endDate;

            if (!this.filter) {
                this.filter = {};
            }
            if (!this.filter.startDate) {
                this.filter.startDate = {
                    key  : 'startDate',
                    type : 'date',
                    value: new Date(dateRange.startDate)
                };
                this.filter.endDate = {
                    key  : 'endDate',
                    type : 'date',
                    value: new Date(dateRange.endDate)
                };
            }

            options.startDate = this.startDate;
            options.endDate = this.endDate;
            options.filter = this.filter;

            Custom.cacheToApp('shippingPlanDateRange', {
                startDate: this.startDate,
                endDate  : this.endDate
            });

            page = options.page;

            if (page) {
                return this.getPage(page, options);
            }

            this.getFirstPage(options);
        },

        showMore: function (options) {
            var that = this;
            var filterObject = options || {};

            filterObject.filter = options ? options.filter : {};

            this.fetch({
                data   : filterObject,
                waite  : true,
                success: function (models) {
                    that.page += 1;
                    that.trigger('showmore', models);
                },

                error: function () {
                    App.render({
                        type   : 'error',
                        message: 'Some Error.'
                    });
                }
            });
        }
    });
    return GoodsOutCollection;
});
