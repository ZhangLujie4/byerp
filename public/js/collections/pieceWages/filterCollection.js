define([
        'Backbone',
        'collections/parent',
        'models/PieceWagesModel',
        'custom'
    ],
    function (Backbone, Parent, Model, Custom) {
        var PieceWagesCollection = Parent.extend({
            model       : Model,
            url         : '/pieceWages/',
            page        : null,
            namberToShow: null,
            viewType    : null,
            contentType : null,

            initialize: function (options) {
                var that = this;
                var dateRange;
                var startDate = new Date();
                startDate.setMonth(0);
                startDate.setDate(1);
	
		function _errHandler(models, xhr) {
                    if (xhr.status === 401) {
                        Backbone.history.navigate('#login', {trigger: true});
                    }
                    if (xhr.status === 400) {
                        var tempMessage = xhr.responseJSON.error.split('Error')[0];
                        App.render({
                            type   : 'error',
                            message: tempMessage
                        });
                    }
                }
                options.error = options.error || _errHandler;

                this.startTime = new Date();
                this.namberToShow = options.count;
                this.viewType = options.viewType;
                this.contentType = options.contentType;
                this.page = options.page || 1;

                //this.filter = options.filter || Custom.retriveFromCash('pieceWages.filter');
                this.filter = options.filter || {};
                dateRange = Custom.retriveFromCash('pieceWagesDateRange') || {};
                this.startDate = dateRange.startDate;

                this.startDate = dateRange.startDate || startDate;

                options.startDate = this.startDate;
                options.filter = this.filter;

                Custom.cacheToApp('pieceWagesDateRange', {
                    startDate: this.startDate,
                });

                var page = this.page;
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
        return PieceWagesCollection;
    });
