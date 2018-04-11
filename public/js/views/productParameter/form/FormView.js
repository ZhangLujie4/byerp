define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/productParameter/form/FormTemplate.html',
    'views/productParameter/EditView',
    'views/productParameter/FormulaView',
    'collections/productParameter/filterCollection',
    'models/ProductModel',
    'views/selectView/selectView',
    'views/productParameter/CreateView',
    'helpers',
    'moment',
    'populate',
    'dataService',
    'async',
    'constants'
], function (Backbone, $, _, ParameterTemplate, EditView, FormulaView, editCollection, CurrentModel, selectView, CreateView, helpers, moment, populate, dataService, async, CONSTANTS) {
    var productParameter = Backbone.View.extend({

        el           : '#content-holder',
        changedModels: {},
        responseObj  : {},

        initialize: function (options) {
            var hash = window.location.hash;

            this.collection = options.model;
            this.collection.urlRoot = '/productParameter/';
            var urlArray = window.location.hash.split('/');
            this.id =  urlArray[3];
        },

        events: {
            'click .checkbox'                                : 'checked',
            'click #parameter-TableBody td:not(.expand, .checkbox, .diff)': 'goToEditDialog'
        },

        goToEditDialog: function(e) {
            var tr = $(e.target).closest('tr')
            var name = tr.find('.name').text();
            var value = tr.find('.value').text();
            var column = tr.find('.column').text();
            var seq = tr.find('.seq').text();
            var minRange = tr.find('.checkbox').attr('data-content');
            var maxRange = tr.find('.checkbox').attr('data-id');
            return new EditView({
                model: this.collection,
                name: name,
                value: value,
                column: column,
                minRange: minRange,
                maxRange: maxRange
            });
        },

        editItem: function () {
            var formula = this.collection.toJSON()[0];
            return new FormulaView({
                id: this.id,
                data: formula
            });
        },

        goSort: function (e) {
            var target$;
            var currentParrentSortClass;
            var sortClass;
            var sortConst;
            var sortBy;
            var sortObject;

            this.collection.unbind('reset');
            this.collection.unbind('showmore');

            target$ = $(e.target).closest('th');
            currentParrentSortClass = target$.attr('class');
            sortClass = currentParrentSortClass.split(' ')[1];
            sortConst = 1;
            sortBy = target$.data('sort');
            sortObject = {};

            if (!sortClass) {
                target$.addClass('sortUp');
                sortClass = 'sortUp';
            }
            switch (sortClass) {
                case 'sortDn':
                    target$.parent().find('th').removeClass('sortDn').removeClass('sortUp');
                    target$.removeClass('sortDn').addClass('sortUp');
                    sortConst = 1;
                    break;
                case 'sortUp':
                    target$.parent().find('th').removeClass('sortDn').removeClass('sortUp');
                    target$.removeClass('sortUp').addClass('sortDn');
                    sortConst = -1;
                    break;
                // skip default;
            }
            sortObject[sortBy] = sortConst;

            this.fetchSortCollection(sortObject);
        },

        deleteItems: function () {
            var that = this;
            var answer = confirm('确定要删除吗?!');
            var value;
            var tr;

            if (!this.changed) {
                if (answer === true) {
                    $.each(that.$el.find('input:checked'), function (index, checkbox) {
                        checkbox = $(checkbox);
 
                        tr = checkbox.closest('tr');
                        if (tr) {
                            that.deleteItem(tr);
                        }
                    });
                }
            } else {
                this.cancelChanges();
            }
        },

        deleteItem: function (tr) {
            var self = this;
            var model;
            var mid = 39;
            var collection = this.collection.toJSON();
            var id = collection[0]._id;
            var name = tr.find('.name').text();
            //var value = $(e.target).closest('tr').find('value').text();
            dataService.deleteData('productParameter/'+ id , name ,function(){
                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true});
            });
        },

        createItem: function () {
            var collection = this.collection.toJSON();

            var id = collection[0]._id;
            return new CreateView({id: id});

        },

        checked: function (e) {
            var checkLength;
            var target = $(e.target);
            var id = target.attr('id');

            e.stopPropagation();

            if (this.$el.find('#false').length) {
                return false;
            }

            checkLength = $('input.checkbox:checked').length;

            if ($('input.checkbox:checked').length > 0) {
                $('#top-bar-parameter-createBtn').hide();
                $('#top-bar-deleteBtn').show();
                if (checkLength === 1) {
                    $('#top-bar-createBtn').hide();
                } 
                if (checkLength === this.collection.length) {
                    this.$el.find('.checkAll').prop('checked', true);
                } else {
                    this.$el.find('.checkAll').prop('checked', false);
                }
            } else {
                this.$el.find('.checkAll').prop('checked', false);
                $('#top-bar-deleteBtn').hide();
                $('#top-bar-parameter-createBtn').show();
            }
        },

        render: function () {
            var self = this;
            var collection = this.collection.toJSON();

            this.$el.html(_.template(ParameterTemplate, {
                collection      : collection,
                currencySplitter: helpers.currencySplitter
            }));

            this.$bodyContainer = this.$el.find('#payRoll-listTable');
        
            $('#top-bar-createBtn').show();
            $('#top-bar-editBtn').hide();
            $('#top-bar-deleteBtn').hide();

            return this;
        }
    });
    return productParameter;
});
