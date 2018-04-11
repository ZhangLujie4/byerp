define([
    'Backbone',
    'Underscore',
    'models/OpportunitiesModel',
    'common'
], function (Backbone, _, OpportunityModel, common) {
    'use strict';

    var OpportunitiesCollection = Backbone.Collection.extend({
        model: OpportunityModel,
        parse: function (response) {
            if (response && response.data) {
                _.map(response.data, function (opportunity) {
                    if (opportunity.expectedClosing) {
                        opportunity.expectedClosing =  common.utcDateToLocaleDate(opportunity.expectedClosing) || '';
                    }
                    if (opportunity.biderDate) {
                        opportunity.biderDate =  common.utcDateToLocaleDate(opportunity.biderDate) || '';
                    }
                    return opportunity;
                });
            }
            return response.data;
        }
    });
    return OpportunitiesCollection;
});
