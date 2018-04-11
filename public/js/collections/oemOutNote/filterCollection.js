define([
    'Backbone',
    'models/oemOutNoteModel',
    'collections/parent',
    'helpers/getDateHelper',
    'constants',
    'moment',
    'custom'
], function (Backbone, Model, Parent, DateHelper, CONSTANTS, moment, Custom) {
    var Collection = Parent.extend({
        model: Model,
        url  : CONSTANTS.URLS.OEMOUTNOTE,
        page        : null,
        namberToShow: null,
        viewType    : null,
        contentType : null,

        initialize: function (options) {

            function _errorHandler(models, xhr) {
                if (xhr.status === 401) {
                    Backbone.history.navigate('#login', {trigger: true});
                }
            }

            var page;
            var dateRange;
            var startDate = new Date();
            var endDate = new Date();

            options = options || {};

            this.startTime = new Date();
            this.filter = options.filter || Custom.retriveFromCash('oemOutNote.filter');

            startDate.setMonth(0);
            startDate.setDate(1);
            endDate.setMonth(11);
            endDate.setDate(31);
            dateRange = Custom.retriveFromCash('oemOutNoteDateRange') || {};

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

            Custom.cacheToApp('oemOutNoteDateRange', {
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
    return Collection;
});

