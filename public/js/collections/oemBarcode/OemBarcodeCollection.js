define([
    'Backbone',
    'Underscore',
    'models/OemBarcodeModel',
    'common',
    'collections/parent'
], function (Backbone, _, OemBarcodeModel, common, Parent) {
    'use strict';

    var OemBarcodeCollection = Parent.extend({
        model: OemBarcodeModel,

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

    return OemBarcodeCollection;
});
