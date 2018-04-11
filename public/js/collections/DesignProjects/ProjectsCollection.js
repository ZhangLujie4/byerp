define([
        'Backbone',
        'jQuery',
        'models/DesignProjectsModel',
        'constants'
    ],
    function (Backbone, $, ProjectModel, CONSTANTS) {
        'use strict';

        var ProjectsCollection = Backbone.Collection.extend({
            model     : ProjectModel,
            url       : function () {
                return CONSTANTS.URLS.DESIGNPROJECTS;
            },
            initialize: function () {
                var mid = 39;

                this.fetch({
                    data   : $.param({
                        mid: mid
                    }),
                    type   : 'GET',
                    reset  : true,
                    success: this.fetchSuccess,
                    error  : this.fetchError
                });
            },

            parse: function (response) {
                return response.data;
            }
        });
        return ProjectsCollection;
    });