define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/salaryReport/HeadTemplate.html',
    'custom',
    'common',
    'constants'
], function (Backbone, $, _,  HeadTemplate, Custom, Common, CONSTANTS) {
    'use strict';

    var HeadView = Backbone.View.extend({
        el         : '#salary-head',
        contentType: CONSTANTS.SALARYREPORT,
        template   : _.template(HeadTemplate),

        initialize: function (options) {
            this.year = options.year;
            this.month = options.month;
            this.page = isNaN(options.page) ? 1 : options.page;
            this.lastPage = isNaN(options.lastPage) ? 1 : options.lastPage;
            this.department = options.department ? options.department : '';
            this.render();

        },

        render: function(){

            this.$el.append(_.template(HeadTemplate, {
                year            : this.year,
                month           : this.month,
                page            : this.page,
                lastPage        : this.lastPage,
                department      : this.department,
            }));
            
            //return this;
        }
    });

    return HeadView;
});
