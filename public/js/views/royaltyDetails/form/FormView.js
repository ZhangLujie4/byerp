/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/royaltyDetails/form/FormTemplate.html',
    'text!templates/royaltyDetails/temps/documentTemp.html',
    'views/royaltyDetails/form/PersonView',
    'views/dialogViewBase',
    'views/Assignees/AssigneesView',
    'common',
    'custom',
    'dataService',
    'populate',
    'constants',
    'helpers',
    'moment'
], function (Backbone,
             $,
             _,
             EditTemplate,
             DocumentTemplate,
             PersonView,
             BaseView,
             AssigneesView,
             common,
             Custom,
             dataService,
             populate,
             CONSTANTS,
             helpers,
             moment) {
    'use strict';

    var FormView = BaseView.extend({
        contentType: CONSTANTS.ROYALTYDETAILS,
        imageSrc   : '',
        template   : _.template(EditTemplate),
        templateDoc: _.template(DocumentTemplate),

        initialize: function (options) {
            if (options) {
                this.visible = options.visible;
                this.eventChannel = options.eventChannel;
            }

            _.bindAll(this, 'render', 'deleteItem');

            if (options.model) {
                this.currentModel = options.model;
            } else {
                this.currentModel = options.collection.getElement();
            }

            this.currentModel.urlRoot = '/royaltyDetails';

            this.currentModel.on('sync', this.render, this);
            this.responseObj = {};
        },

        events: {
            'click #createPerson' : 'createPerson',
            'click .goToEdit'     : 'goToEdit',
            'click .goToRemove'   : 'goToRemove'
        },

        createPerson: function (e) {
            e.preventDefault();
            
            return new PersonView({
                model : this.currentModel
            });
        },

        goToEdit: function(e) {
            var tr = $(e.target).closest('tr');
            var personId = tr.attr('data-id');
            var person = {};
            var persons = this.currentModel.toJSON().persons;
            for(var i=0; i<persons.length; i++){
                if(persons[i].name._id === personId){
                    person = persons[i];
                }
            }

            e.preventDefault();

            if (person) {
                return new PersonView({model: this.currentModel, person: person});
            }
        },

        goToRemove: function(e) {
            var mid = 3;
            var tr = $(e.target).closest('tr');
            var personId = tr.attr('data-id');
            var person = {};
            var persons = this.currentModel.toJSON().persons;
            var year = this.currentModel.toJSON().year;
            for(var i=0; i<persons.length; i++){
                if(persons[i].name._id === personId){
                    person.name = persons[i].name._id;
                    person.scale = persons[i].scale.toString();
                    person.deductions = persons[i].deductions.toString();
                }
            }

            var answer = confirm('真的要删除吗 ?!');
            if(answer){
                this.model.save({
                    data : person,
                    year : year
                }, {
                    headers: {
                        mid: mid
                    },
                    patch  : true,
                    success: function () {
                        var url = window.location.hash;

                        Backbone.history.fragment = '';
                        Backbone.history.navigate(url, {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            }
        },

        render: function () {
            var $thisEl = this.$el;
            var model = this.currentModel.toJSON();
            var formString;
            var template;

            formString = this.template({
                model        : model,
                visible      : this.visible,
                hidePrAndCust: this.hidePrAndCust
            });

            template = this.templateDoc({
                model           : model,
                currencySplitter: helpers.currencySplitter
            });


            $thisEl.html(formString);

            $thisEl.find('#templateDiv').html(template);

            this.delegateEvents(this.events);

            App.stopPreload();

            return this;
        }
    });

    return FormView;
});
