/**
 * 定义了系列事件绑定
 */
define([
    'Underscore',
    'jQuery'
], function (_, $) {
    'use strict';

    return {
        subscribeCollectionEvents: function (collection, contentView) {
            collection.bind('showmore', contentView.showMoreContent, contentView);
            collection.bind('showmoreAlphabet', contentView.showMoreAlphabet, contentView);
            collection.bind('fetchFinished', contentView.setPagination, contentView);
            collection.bind('errorPagination', function (err) {
                App.render({
                    type   : 'error',
                    message: err.statusText || 'Some Error.'
                });
            });

            $(document).on('click', function (e) {
                if (contentView && typeof (contentView.hide) === 'function') {
                    contentView.hide(e);
                }
            });
        },

        subscribeTopBarEvents: function (topBarView, contentView) {
            topBarView.bind('createEvent', contentView.createItem, contentView);
            topBarView.bind('goodsEvent', contentView.goodsItem, contentView);
            topBarView.bind('editEvent', contentView.editItem, contentView);
            topBarView.bind('deleteEvent', contentView.deleteItems, contentView);
            topBarView.bind('saveEvent', contentView.saveItem, contentView);
            topBarView.bind('exportToCsv', contentView.exportToCsv, contentView);
            topBarView.bind('exportToXlsx', contentView.exportToXlsx, contentView);
            topBarView.bind('importEvent', contentView.importFiles, contentView);
            topBarView.bind('copyEvent', contentView.copy, contentView);
            topBarView.bind('generateEvent', contentView.generate, contentView);
            topBarView.bind('generateInvoice', contentView.generateInvoice, contentView);
            topBarView.bind('copyRow', contentView.copyRow, contentView);
            topBarView.bind('pay', contentView.newPayment, contentView);
            topBarView.bind('changeDateRange', contentView.changeDateRange, contentView);
            topBarView.bind('recountAllEvent', contentView.recountAll, contentView);
            topBarView.bind('moveToEdit', contentView.moveToEdit, contentView);
            topBarView.bind('saveAllEvent', contentView.saveDashboard, contentView);
            topBarView.bind('removeAllEvent', contentView.removeAllCharts, contentView);
            topBarView.bind('RKevent', contentView.gotoForm, contentView);
       	    topBarView.bind('crawlerAluminum', contentView.crawlerAluminum, contentView);
            topBarView.bind('settingsEvent', contentView.settings, contentView);
	    topBarView.bind('borrowEvent', contentView.borrowItems, contentView);
            topBarView.bind('returnEvent', contentView.returnItems, contentView);
            topBarView.bind('watchAllEvent', contentView.watchAll, contentView);
            topBarView.bind('affirmEvent', contentView.affirm, contentView);
            topBarView.bind('borrowAllEvent', contentView.borrowAll, contentView);
            topBarView.bind('uploadEvent', contentView.uploadItem, contentView);
            topBarView.bind('goodsOutEvent', contentView.goodsOutItem, contentView);
            topBarView.bind('goodsFOutEvent', contentView.goodsFOutItem, contentView);
            topBarView.bind('goodsFInEvent', contentView.goodsFInItem, contentView);
        },

        subscribeCustomChartEvents: function(chartView, gridView){
            chartView.bind('actionWithChart', gridView.markEngagedCells, gridView);
            chartView.bind('changeDateRange', chartView.changeDateRange, chartView);
        }
    };
});
