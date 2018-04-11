define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/productBunchType/EditTemplate.html',
    'populate',
    'constants',
    'helpers',
    'moment',
    'dataService'
], function (Backbone, $, _, ParentView, EditTemplate, populate ,CONSTANTS ,helpers, moment, dataService) {
    'use strict';

    var EditView = ParentView.extend({
        contentType: "productBunchType",
        template   : _.template(EditTemplate),
        responseObj :{},
        events: {
        },

        initialize: function (options) {

            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/productBunchType';
            this.count = options.count;
            this.redirect = options.redirect;
            if (options.collection) {
                this.collection = options.collection;
            }
            console.log(this.currentModel);
            this.render();
        },

        hideDialog: function () {
            $('.edit-productBunchType-dialog').remove();
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function(e){
            var self = this;
            var mid = 39;
            var $currentEl = this.$el;
            var name = $.trim($currentEl.find('#name').val());
            var price = $.trim($currentEl.find('#price').val());
            var supplier = $currentEl.find('#supplier').data('id');
            var data;

            data = {
                name: name,
                price: price,
                supplier: supplier
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            this.currentModel.save(data, {
                patch  : true,
                headers: {
                    mid: mid
                },
                wait   : true,
                success: function () {
                    self.hideDialog();
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },
        
        render: function () {
            var self = this;
            var formString;
            var buttons;
            var model = this.currentModel.toJSON();

            this.$el.delegate(function(events){
                event.stopPropagation();
                event.preventDefault();
            });
            console.log(model);
            formString = this.template({
                model           : model,
                count           : this.count
            });

            buttons = [
                {
                    text : '保存',
                    class: 'btn blue',
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
                }
            ];

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-productBunchType-dialog',
                title        : 'Edit productBunchType',
                width        : self.isWtrack ? '1200' : '900',
                position     : {my: 'center bottom', at: 'center', of: window},
                buttons      : buttons

            });

            dataService.getData('Customers/getCompaniesForDd', {}, function(res, context){
                var suppliers = res.data;
                function decroteAllArray(r) {
                    return {
                        "_id": r._id,
                        "name": r.name.first
                    }
                };
                var result = suppliers.map(function(r){
                    return decroteAllArray(r);
                });

                context.responseObj['#supplier'] = result;
            },this);
                
            return this;
        }

    });

    return EditView;
});
