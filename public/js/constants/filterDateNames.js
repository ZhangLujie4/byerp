'use strict';

(function () {
    var root;

    var DATE_FILTER_NAMES = {
        line: {
            _id: 'line'
        },

        thisWeek: {
            _id : 'thisWeek',
            name: '本周'
        },

        thisMonth: {
            _id : 'thisMonth',
            name: '本月'
        },

        thisYear: {
            _id : 'thisYear',
            name: '本年'
        },

        thisFinYear: {
            _id : 'thisFinYear',
            name: '本财年'
        },

        lastWeek: {
            _id : 'lastWeek',
            name: '上周'
        },

        lastMonth: {
            _id : 'lastMonth',
            name: '上月'
        },

        lastQuarter: {
            _id : 'lastQuarter',
            name: '上季'
        },

        lastFinYear: {
            _id : 'lastFinYear',
            name: '上一财年'
        },

        lastYear: {
            _id : 'lastYear',
            name: '上年'
        },

        custom: {
            _id : 'custom',
            name: '定制日期'
        },

        sevenDays: {
            _id : '7',
            name: '7D'
        },

        thirtyDays: {
            _id : '30',
            name: '30D'
        },

        ninetyDays: {
            _id : '90',
            name: '90D'
        },

        twelveMonths: {
            _id : '365',
            name: '12M'
        },

        day: {
            _id : 'day',
            name: 'Day'
        },

        week: {
            _id : 'week',
            name: '周'
        },

        month: {
            _id : 'month',
            name: '月'
        },

        dayOfWeek: {
            _id : 'dayOfWeek',
            name: 'Day Of Week'
        },

        dayOfMonth: {
            _id : 'dayOfMonth',
            name: 'Day Of Month'
        },

        endDate: {
            _id: 'endDate'
        }
    };

    if (typeof window === 'object' && this === window) {
        root = window;
    } else if (typeof global === 'object' && this === global) {
        root = global;
    } else {
        root = this;
    }

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = DATE_FILTER_NAMES;
        }
    } else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return DATE_FILTER_NAMES;
        });
    } else {
        root.DATE_FILTER_NAMES = DATE_FILTER_NAMES;
    }
}());
