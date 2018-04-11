define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/productParameter/EditTemplate.html',
    'models/ProductModel',
    'moment',
    'constants',
    'populate',
    'dataService',
    'common'
], function ($, _, Backbone, ParentView, EditTemplate, ProductModel, moment, CONSTANTS, populate, dataService, common) {

    var EditView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'productParameter',
        template   : _.template(EditTemplate),
        responseObj: {},

         events: {
         },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;
            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/productParameter';
            this.name = options.name;
            this.value = options.value;
            this.column = options.column;
            this.seq = options.seq;
            this.minRange = options.minRange;
            this.maxRange = options.maxRange;
            self.eventChannel = options.eventChannel;
            this.response = options.response;
            self.render(options);
        },

        saveItem: function (e) {
            var self = this;
            var $currentEl = this.$el;
            var model = this.currentModel.toJSON();
            var name = this.$el.find('#name').val();
            var value = this.$el.find('#value').val();
            var seq = this.$el.find('#seq').val();
            var minRange = this.$el.find('#minRange').val();
            var maxRange = this.$el.find('#maxRange').val();
            var column = this.$el.find('#column').val();
            var data = {
                prename: this.name,
                name: name,
                value: value,
                column: column,
                seq: seq,
                minRange: minRange,
                maxRange: maxRange
            };

            var id = model[0]._id;
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            dataService.patchData('productParameter/'+ id , data ,function(){
                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true});
            });
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        render: function (options) {
            var model = this.currentModel.toJSON();
            var formString = this.template({
                column: this.column,
                name: this.name,
                value: this.value,
                seq: this.seq,
                minRange: this.minRange,
                maxRange: this.maxRange
            });
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'edit parameter',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'save-parameter-btn',
                        class: 'btn blue',
                        text : '保存',
                        click: function () {
                            self.saveItem();
                        }
                    },

                    {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }]

            });


            this.delegateEvents(this.events);

            return this;
        }

    });

    return EditView;
});
