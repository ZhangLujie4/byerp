define([
    'Backbone',
    'Underscore',
    'models/GoodsBarcodeModel',
    'common',
    'collections/parent'
], function (Backbone, _, GoodsBarcodeModel, common, Parent) {
    'use strict';

    var GoodsBarcodeCollection = Parent.extend({
        model: GoodsBarcodeModel,

        parse: function (response) {
            if (response.data) {
                _.map(response.data, function (task) {

                    if (task.createdBy) {
                        task.createdBy.date = common.utcDateToLocaleDateTime(task.createdBy.date);
                    }
                    if (task.editedBy) {
                        task.editedBy.date = common.utcDateToLocaleDateTime(task.editedBy.date);
                    }

                    return task;
                });
            }

            return Parent.prototype.parse.call(this, response);
        }
    });

    return GoodsBarcodeCollection;
});
