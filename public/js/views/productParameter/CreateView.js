define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/productParameter/CreateTemplate.html',
    'models/ProductModel',
    'common',
    'populate',
    'views/dialogViewBase',
    'constants',
    'moment',
    'helpers',
    'dataService'
], function (Backbone, $, _, CreateTemplate, ProductModel, common, populate, ParentView, CONSTANTS, moment, helpers, dataService) {
    'use strict';

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'productParameter',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #range': 'toggleRange'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.id = options.id;
            this.render(options);
        },

        toggleRange: function () {

            this.$el.find('#range-content').toggle();

        },

        saveItem: function () {
            var self = this;

            var mid = 118;
            var model = new ProductModel();
            var name = $.trim(this.$el.find('#name').val());
            var value = $.trim(this.$el.find('#value').val());
            var maxRange = this.$el.find('#maxRange').val();
            var minRange = this.$el.find('#minRange').val();
            var column = $.trim(this.$el.find('#column').val());
            var seq = $.trim(this.$el.find('#seq').val());
            var data = {
                name: name,
                value: value,
                maxRange: maxRange,
                minRange: minRange,
                column: column,
                seq: seq
            };
            dataService.postData('productParameter/'+ this.id, data, function(){
                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true});
            });
            
        },

        hideSaveCancelBtns: function () {
            var cancelBtnEl = $('#top-bar-saveBtn');
            var saveBtnE1 = $('#top-bar-deleteBtn');
            var createBtnE1 = $('#top-bar-createBtn');
            this.changed = false;

            cancelBtnEl.hide();
            saveBtnE1.hide();
            createBtnE1.show();
            return false;
        },

        render: function (options) {
            console.log(this.id);
            var formString = this.template();
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                draggable    : true,
                autoOpen     : true,
                resizable    : true,
                dialogClass: 'edit-dialog',
                width      : 900,
                title      : 'Create settingsStamp',
                buttons    : {
                    save: {
                        text : '保存',
                        class: 'btn blue',
                        id   : 'createBtnDialog',
                        click: self.saveItem

                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                            self.hideSaveCancelBtns();
                        }
                    }
                }
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;

});
