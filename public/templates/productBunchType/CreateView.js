define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/productBunchType/CreateTemplate.html',
    'models/productBunchTypeModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, CreateTemplate, productBunchTypeModel, moment, CONSTANTS, populate, dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'productBunchType',
        template   : _.template(CreateTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;

            self.eventChannel = options.eventChannel;

            self.render(options);
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            $('.newSelectList').hide();
        },

        saveItem: function (e) {
            var self = this;
            var model;
            var $currentEl = this.$el;

            var name = $.trim($currentEl.find('#name').val());
            var price = $.trim($currentEl.find('#price').val());
            var supplier = $currentEl.find('#supplier').data('id');

            var data = {
                name: name,
                price: price,
                supplier: supplier
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }


            model = new productBunchTypeModel();
            model.urlRoot = function () {
                return 'productBunchType';
            };

            model.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function () {
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        render: function (options) {
            var formString = this.template();
            var self = this;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Create productBunchType',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-productBunchType-dialog',
                        class: 'btn blue',
                        text : '创建',
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

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
