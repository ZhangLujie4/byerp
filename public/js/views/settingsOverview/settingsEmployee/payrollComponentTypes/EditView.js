define([
    'jQuery',
    'Underscore',
    'Backbone',
    'text!templates/payrollComponentTypes/EditTemplate.html',
    'models/PayrollComponentTypeModel'
], function ($, _, Backbone, EditTemplate) {

    var EditView = Backbone.View.extend({
        el         : '#content-holder',
        contentType: 'payrollComponentTypes',
        template   : _.template(EditTemplate),

        initialize: function (options) {
            var self = this;

            options = options || {};

            self.model = options.model;
            self.type = options.type;
            self.collection = options.collection;

            self.render();
        },

        saveItem: function () {
            var self = this;
            var model;
            var $currentEl = this.$el;
            var name = $.trim($currentEl.find('#payrollComponentTypeName').val());
            var description = $currentEl.find('#payrollComponentTypeComment').val();
            var minRange = $currentEl.find('#minRange').val();
            var maxRange = $currentEl.find('#maxRange').val();
            var data = {
                name       : name,
                description: description,
                type       : self.type,
                minRange   : parseFloat(minRange),
                maxRange   : parseFloat(maxRange)
            };

            if (!name) {
                return App.render({
                    type   : 'error',
                    message: '名称不能为空'
                });
            }

            if (minRange > maxRange) {
                return App.render({
                    type   : 'error',
                    message: '最大值必须大于或者等于最小值'
                });
            }

            model = self.model;
            model.urlRoot = function () {
                return 'payrollComponentTypes';
            };

            model.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function (model) {
                    self.hideDialog();

                    self.collection.set(model, {remove: false});
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

        formulaParser: function (formula) {
            var formulaStr = '';
            var length = formula.length || 0;
            var i;
            var formulaObject = {};
            var lastSign;
            var signs = ['+', '-', '/', '*'];

            this.operations = {
                multiply : '*',
                divide   : '/',
                substract: '-',
                add      : '+'
            };

            for (i = 0; i <= length - 1; i++) {
                formulaObject = formula[i];

                formulaStr += ' ' + formulaObject.operand + ' ' + this.operations[formulaObject.operation] + ' ' + formulaObject.ratio + ' ' + this.operations[formulaObject.prefix];
            }

            lastSign = formulaStr[formulaStr.length - 1];

            if (signs.indexOf(lastSign) !== -1) {
                formulaStr = formulaStr.substr(0, formulaStr.length - 1);
            }

            this.$el.find('#formula').text(formulaStr);

            return formulaStr;
        },

        render: function () {
            var self = this;
            var formString = this.template({
                model: self.model.toJSON(),
                type : self.type
            });

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'edit-dialog',
                title      : 'Create WeeklyScheduler',
                width      : '500px',
                position   : {within: $('#wrapper')},
                buttons    : [{
                    id   : 'create-weeklyScheduler-dialog',
                    class: 'btn blue',
                    text : '保存',
                    click: function () {
                        self.saveItem();
                    }
                }, {
                    text : '取消',
                    class: 'btn',
                    click: function () {
                        self.hideDialog();
                    }
                }]

            });

            this.formulaParser(this.model.get('formula'));

            this.delegateEvents(this.events);

            return this;
        }

    });

    return EditView;
});
