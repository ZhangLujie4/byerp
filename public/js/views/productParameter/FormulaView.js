define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/productParameter/FormulaTemplate.html',
    'text!templates/productParameter/FormulaElementTemplate.html',
    'models/ProductModel',
    'common',
    'populate',
    'views/dialogViewBase',
    'constants',
    'moment',
    'helpers',
    'dataService'
], function (Backbone, $, _, FormulaTemplate, FormulaElementTemplate, ProductModel, common, populate, ParentView, CONSTANTS, moment, helpers, dataService) {
    'use strict';

    var FormulaView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'productParameter',
        template   : _.template(FormulaTemplate),
        elementTemplate: _.template(FormulaElementTemplate),
        responseObj: {},

        events: {
            'click #addFormulaElement': 'addFormulaElement',
            'click .icon-trash'       : 'removeEl',
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.id = options.id;
            this.data = options.data || {};
            this.mapValues = {};
            this.seq = (this.data && this.data.formula && this.data.formula.length) || 0;
            this.render(options);
        },

        addFormulaElement: function (e) {
            var self = this;

            e.preventDefault();
            e.stopPropagation();

            $('#formula').append(self.elementTemplate({seq: self.seq++}));
        },

        removeEl: function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(e.target).closest('div.formulaElement').remove();
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var parentUl = $target.parent();
            var element = $target.closest('a') || parentUl.closest('a');
            var id = element.attr('id') || parentUl.attr('id');
            var targetId = $target.attr('id');
            var $mulDivDd = $target.closest('.formulaElementOperand').find('#mulDivDd');

            $target.closest('span').find('.current-selected').text($target.text()).attr('data-id', targetId);

            if (targetId === 'const') {
                $mulDivDd.hide();
            } else {
                $mulDivDd.show();
            }
        },

        saveItem: function () {
            var self = this;

            var mid = 118;
            var data = {};
            data.formula = [];
            var model = new ProductModel();
            $('.formulaElement').each(function () {
                var $element = $(this);
                var element = {};
                var seq = $element.attr('data-seq');

                element.prefix = $.trim($element.find('#sumSubDd').attr('data-id'));
                element.operand = $.trim($element.find('#operandDd').attr('data-id'));
                element.operation = $.trim($element.find('#mulDivDd').attr('data-id'));
                element.ratio = $.trim($element.find('#ratio').val());

                if (!element.operand) {
                    err = 'All operands should be selected';
                }

                data.formula[seq] = element;
            });
 
            dataService.patchData('productParameter/formula/'+ this.id, data, function(){
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

        renderFormula: function () {
            var self = this;
            var $formula;
            var elemString;
            var formula;
            var mapValues = self.mapValues;
            var data = self.data;
            $formula = $('#formula');
            if (!self.seq) {
                elemString = self.elementTemplate({seq: self.seq++});
                $formula.append(elemString);
            } else {
                formula = data.formula;
                formula.forEach(function (formulaEl, seq) {
                    var elData = {
                        prefix   : {},
                        operand  : {},
                        operation: {}
                    };

                    elData.prefix.id = formulaEl.prefix;
                    elData.prefix.name = mapValues['#sumSubDd'][formulaEl.prefix];
                    elData.operand.id = formulaEl.operand;
                    elData.operand.name = mapValues['#operandDd'][formulaEl.operand];
                    elData.operation.id = formulaEl.operation;
                    elData.operation.name = mapValues['#mulDivDd'][formulaEl.operation];
                    elData.ratio = formulaEl.ratio;

                    $('#formula').append(self.elementTemplate({
                        seq   : seq,
                        elData: elData
                    }));
                });
            }


        },

        render: function (options) {
            var formString = this.template();
            var self = this;
            var id = this.id;
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

            dataService.getData('/productParameter/getForDD', {id: id}, function(res){
                var parameter = res[0].parameter;
                // var result = parameter.map(r => r.name);
                function decroteAllArray(r) {
                    return {
                        "_id": r.name,
                        "name": r.name
                    }
                };
                var result = parameter.map(function(r){
                    return decroteAllArray(r);
                });

                self.responseObj['#operandDd'] = result;
                self.responseObj['#mulDivDd'] = [
                    {
                        _id : 'multiply',
                        name: 'x'
                    }, {
                        _id : 'divide',
                        name: '/'
                    },{
                        _id : 'add',
                        name: '+'
                    }, {
                        _id : 'substract',
                        name: '-'
                    }
                ];
                self.responseObj['#sumSubDd'] = [
                    {
                        _id : 'multiply',
                        name: 'x'
                    }, {
                        _id : 'divide',
                        name: '/'
                    },{
                        _id : 'add',
                        name: '+'
                    }, {
                        _id : 'substract',
                        name: '-'
                    }
                ];

                Object.keys(self.responseObj).forEach(function (ddElement) {
                    var val = {};
                    self.responseObj[ddElement].forEach(function (el) {
                        val[el._id] = el.name;
                    });
                    self.mapValues[ddElement] = val;
                });

                self.renderFormula();
            });

            

            this.delegateEvents(this.events);

            return this;
        }
    });

    return FormulaView;

});
