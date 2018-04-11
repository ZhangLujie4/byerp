define([
    'Backbone',
    'constants',
    'Validation'
], function (Backbone, CONSTANTS, Validation) {
    'use strict';

    var productSurfaceTreatModel = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot    : function () {
            return CONSTANTS.URLS.PRODUCTSURFACETREAT;
        },

        initialize: function () {
            this.on('invalid', function (model, errors) {
                var msg;

                if (errors.length > 0) {
                    msg = errors.join('\n');

                    App.render({
                        type   : 'error',
                        message: msg
                    });
                }
            });
        },

        defaults: {
        },

        validate: function (attrs) {
            var errors = [];
            Validation.checkNameField(errors, true, attrs['name'], '名称');
            Validation.checkNameField(errors, true, attrs['price'], '金额');
            Validation.checkNameField(errors, true, attrs['supplier'], '供应商');

            if (errors.length > 0) {
                return errors;
            }
        },
    });

    return productSurfaceTreatModel;
});
