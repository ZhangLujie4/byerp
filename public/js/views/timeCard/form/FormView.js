define([
        'Backbone',
        'jQuery',
        'Underscore',
        'text!templates/timeCard/form/FormTemplate.html',
        'text!templates/timeCard/form/labourTemplate.html',
        'collections/timeCard/filterCollection',
        'models/timeCardModel',
        'views/selectView/selectView',
        'constants',
        'async',
        'distpicker',
        'moment'
    ],
    function (Backbone, 
              $, 
              _, 
              FormTemplate, 
              labourTemplate,
              timeCardModelCollection, 
              timeCardModel, 
              SelectView,
              CONSTANTS,
              async,
              distpicker,
              moment) {
        'use strict';

        var FormView = Backbone.View.extend({
            el         : '#content-holder',
            responseObj: {},
            SelectView : SelectView,
            formUrl    : '#easyErp/pieceWages/',

            events: {
                'click .chart-tabs'                                                                    : 'changeTab',
                'click .newSelectList li:not(.miniStylePagination):not(.disabled)'                     : 'chooseOption',
                'click .current-selected:not(.disabled)'                                               : 'showNewSelect',
                click                                                                                  : 'hideSelect',
                'change input:not(.checkbox, .checkAll, .statusCheckbox, #inputAttach, #noteTitleArea)': 'showSaveButton',
                'change select'                                                                        : 'showSaveButton'
            },
            initialize: function (options) {

                var eventChannel = {};

                _.extend(eventChannel, Backbone.Events);
                this.eventChannel = eventChannel;
                this.formModel = options.model;
                this.formModel.urlRoot = '/pieceWages/';
                this.id = this.formModel.id;

            },

            changeTab: function (e) {
                var target = $(e.target);
                var $aEllement = target.closest('a');
                var n;
                var dialogHolder;

                App.projectInfo = App.projectInfo || {};

                App.projectInfo.currentTab = $aEllement.attr('id').slice(0, -3);  // todo id

                target.closest('.chart-tabs').find('a.active').removeClass('active');
                $aEllement.addClass('active');
                n = target.parents('.chart-tabs').find('li').index($aEllement.parent());
                dialogHolder = $('.dialog-tabs-items');
                dialogHolder.find('.dialog-tabs-item.active').removeClass('active');
                dialogHolder.find('.dialog-tabs-item').eq(n).addClass('active');
            },

            chooseOption: function (e) {
                $(e.target).parents('dd').find('.current-selected').text($(e.target).text()).attr('data-id', $(e.target).attr('id'));
                this.showSaveButton();
            },

            showNewSelect: function (e) {
                var $target = $(e.target);
                e.stopPropagation();

                if ($target.attr('id') === 'selectInput') {
                    return false;
                }

                if (this.selectView) {
                    this.selectView.remove();
                }

                this.selectView = new this.SelectView({
                    e          : e,
                    responseObj: this.responseObj
                });

                $target.append(this.selectView.render().el);

                return false;
            },

            hideNewSelect: function () {
                $('.newSelectList').hide();
                $('#health ul').hide();
            },

            nextSelect: function (e) {
                this.showNewSelect(e, false, true);
            },

            prevSelect: function (e) {
                this.showNewSelect(e, true, false);
            },

            render: function () {
                $('.attendanceTop').remove();
                var formModel = this.formModel.toJSON();
                console.log(this.formModel.toJSON());
                if(formModel.data[0].department.externalId == 'A'){
                    this.$el.html(_.template(FormTemplate, {
                        collection: formModel.data,
                        moment: moment
                    }));
                }
                else{
                    this.$el.html(_.template(labourTemplate, {
                        collection: formModel.data,
                        moment: moment
                    }));
                }


                return this;
            },

        });
        return FormView;
    });
