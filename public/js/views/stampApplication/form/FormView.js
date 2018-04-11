define([
        'Backbone',
        'jQuery',
        'Underscore',
        'text!templates/stampApplication/form/FormTemplate.html',
        'models/stampApprovalModel',

    ],
    function (Backbone, $, _, FormTemplate, stampApprovalModel) {
        'use strict';

        var FormView = Backbone.View.extend({
            el        : '#content-holder',
            initialize: function (options) {
                this.formModel = options.model;
                this.formModel.urlRoot = '/stampApplication/';
            },


            render: function () {

                var formModel = this.formModel.toJSON();
                var models = [];
                for(var item in formModel){
                    models.push(formModel[item]);
                }

                console.log(models);
                this.$el.html(_.template(FormTemplate, {
                    collection: models
                }));

                $('#top-bar-deleteBtn').hide();
                $('#top-bar-affirmBtn').hide();
                return this;
            },

        });
        return FormView;
    });
