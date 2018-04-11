define([
    'Backbone',
    'models/shippingNoteModel',
    'collections/parent',
    'helpers/getDateHelper',
    'constants',
    'moment',
    'custom'
], function (Backbone, Model, Parent, DateHelper, CONSTANTS, moment,custom) {
    var Collection = Parent.extend({
        model: Model,
        url  : CONSTANTS.URLS.SHIPPINGFEE,
        
        initialize: function (options) {
            var page;
            var dateRange;
            var startDate = moment(new Date());
            var endDate = moment(new Date());

            this.filter = options.filter || custom.retriveFromCash('shippingFee.filter');
            startDate.month(startDate.month() - 1);
            startDate.date(1);
            endDate.month(startDate.month());
            endDate.endOf('month');

            dateRange = this.filter && this.filter.date ? this.filter.date.value : []; 


            this.startDate = dateRange[0] || new Date(startDate);
            this.endDate = dateRange[1] || new Date(endDate);

            options.filter = this.filter || {};

            options.filter.date = {
                value: [this.startDate, this.endDate]
            };       

            custom.cacheToApp('shippingFee.filter', options.filter);

            function _errorHandler(models, xhr) {
                if (xhr.status === 401) {
                    Backbone.history.navigate('#login', {trigger: true});
                }
            }

            options = options || {};
            page = options.page;
            options.error = options.error || _errorHandler;

            this.contentType = options.contentType;

            this.startTime = new Date();

            if (options.url) {
                this.url = options.url;
            }

            options.reset = true;

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
    return Collection;
});

