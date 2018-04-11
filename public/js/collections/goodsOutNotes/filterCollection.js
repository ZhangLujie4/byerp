define([
    'Backbone',
    'collections/parent',
    'models/goodsOutNotesModel',
    'constants',
    'custom'
], function (Backbone, Parent, GoodsOutModel, CONSTANTS, Custom) {
    var GoodsOutCollection = Parent.extend({
        model   : GoodsOutModel,
        url     : '/goodsOutNotes/',
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
            this.filter = options.filter || Custom.retriveFromCash('goodsOutNote.filter');

            startDate.setMonth(0);
            startDate.setDate(1);
            endDate.setMonth(11);
            endDate.setDate(31);
            dateRange = Custom.retriveFromCash('goodsOutNoteDateRange') || {};

            this.startDate = dateRange.startDate || startDate;
            this.endDate = dateRange.endDate || endDate;

            options.startDate = this.startDate;
            options.endDate = this.endDate;
            options.filter = this.filter;

            Custom.cacheToApp('goodsOutNoteDateRange', {
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
