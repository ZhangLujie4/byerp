define([
    'Backbone',
    'collections/parent',
    'models/EmployeeDashboardItem',
    'custom'
], function (Backbone, Parent, EmpModel, Custom) {
    'use strict';

    var salaryCollection = Parent.extend({

        model       : EmpModel,
        url         : '/salaryReport/',
        contentType : null,
        page        : null,
        numberToShow: null,
        viewType    : 'list',

        initialize: function (options) {
            var page;
            var dateRange;
            var startDate = new Date();
            var endDate = new Date();
            var type = 'A';

            options = options || {};

            this.startTime = new Date();
            this.filter = options.filter || Custom.retriveFromCash('salaryReport.filter');
            this.type = 'A';

            startDate.setMonth(0);
            startDate.setDate(1);
            endDate.setMonth(11);
            endDate.setDate(31);
            dateRange = Custom.retriveFromCash('salaryReportDateRange') || {};

            this.type = dateRange.type || type;
            this.startDate = dateRange.startDate || startDate;
            this.endDate = dateRange.endDate || endDate;

            options.startDate = this.startDate;
            options.endDate = this.endDate;
            options.type = this.type;
            options.filter = this.filter;

            Custom.cacheToApp('salaryReportDateRange', {
                startDate: this.startDate,
                endDate  : this.endDate,
                type: this.type
            });

            page = options.page;

            if (page) {
                return this.getPage(page, options);
            }

            this.getFirstPage(options);
        },

        sortByOrder: function (key, order) {
            this.sortOrder = order;
            this.sortKey = key;

            this.comparator = function (modelA, modelB) {
                var self = this;
                var nameA = getSortName(modelA);
                var nameB = getSortName(modelB);

                function getSortName(model) {
                    var sortAttr = self.sortKey ? model.get(self.sortKey) : model.get('name');

                    return sortAttr;
                }

                if (nameA && nameB) {
                    if (nameA > nameB) {
                        return self.sortOrder;
                    } else if (nameA < nameB) {
                        return self.sortOrder * (-1);
                    }
                    return 0;
                }
            };

            this.sort();
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

    return salaryCollection;
});
