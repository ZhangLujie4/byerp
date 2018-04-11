define([
    'Backbone',
    'Underscore',
    'models/GoodsScrapModel',
    'common',
    'collections/parent'
], function (Backbone, _, GoodsScrapModel, common, Parent) {
    'use strict';

    var GoodsScrapCollection = Parent.extend({
        model: GoodsScrapModel,

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

    return GoodsScrapCollection;
});
