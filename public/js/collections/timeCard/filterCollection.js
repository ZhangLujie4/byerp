define([
        'Backbone',
        'collections/parent',
        'models/timeCardModel',
        'custom'
    ],
    function (Backbone, Parent, Model, Custom) {
        var timeCardCollection = Parent.extend({
            model       : Model,
            url         : '/timeCard/',
            page        : null,
            namberToShow: null,
            viewType    : null,
            contentType : null,

            initialize: function (options) {
                var page;

                function _errHandler(models, xhr) {
                    if (xhr.status === 401) {
                        Backbone.history.navigate('#login', {trigger: true});
                    }
                }

                options = options || {};
                options.error = options.error || _errHandler;
                page = options.page;

                var dateRange;
                var type = 'A';

                this.startTime = new Date();
                this.month = (this.startTime.getMonth() + 1).toString();
                this.year = (this.startTime.getFullYear()).toString();
                this.filter = options.filter || Custom.retriveFromCash('timeCard.filter');
                this.type = 'A';

                dateRange = Custom.retriveFromCash('timeCardDateRange') || {};

                options.filter = this.filter;
                options.type = this.type;

                Custom.cacheToApp('timeCardDateRange', {
                    type: this.type
                });

                if (!options.type) {
                    options.type = this.type;
                }

                if (!options.year) {
                    options.year = this.year;
                }

                if (!options.month) {
                    options.month = this.month;
                }

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
        return timeCardCollection;
    });
