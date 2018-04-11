define([
    'Backbone',
    'collections/parent',
    'models/socialInsuranceModel',
    'constants',
    'custom',
    'moment'
], function (Backbone, Parent, socialInsuranceModel, CONSTANTS, Custom, moment) {
    'use strict';

    var socialInsuranceCollection = Parent.extend({
        model   : socialInsuranceModel,
        url     : CONSTANTS.URLS.SOCIALINSURANCE,
        pageSize: CONSTANTS.DEFAULT_ELEMENTS_PER_PAGE,

        initialize: function (options) {
            var page;
            var startDate = new Date();
            var dateRange;
            var datekey;

            options = options || {};

            this.startTime = new Date();
            this.filter = options.filter || Custom.retriveFromCash('socialInsurance.filter');
            startDate.setMonth(0);
            startDate.setDate(1);

            dateRange = Custom.retriveFromCash('socialInsuranceDateRange') || {};

            this.startDate = dateRange.startDate || startDate;

            options.startDate = this.startDate;
            options.datekey = moment(this.startDate).year() * 100 + moment(this.startDate).month()+1;

            options.filter = this.filter;

            Custom.cacheToApp('socialInsuranceDateRange', {
                startDate: this.startDate,
            });

            function _errHandler(models, xhr) {
                if (xhr.status === 401) {
                    Backbone.history.navigate('#login', {trigger: true});
                }
            }

            options.error = options.error || _errHandler;
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
                    console.log(models);
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

    return socialInsuranceCollection;
});
