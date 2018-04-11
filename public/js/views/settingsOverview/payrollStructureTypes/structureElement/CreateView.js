define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'text!templates/payrollStructureTypes/structureElement/CreateTemplate.html',
    'text!templates/payrollStructureTypes/structureElement/FormulaElementTemplate.html',
    'models/PayrollComponentTypeModel',
    'common',
    'populate',
    'dataService'
], function ($, _, Backbone, Parent, CreateTemplate, FormulaElementTemplate, PayrollComponentTypeModel, common, populate, dataService) {

    var CreateView = Parent.extend({
        el             : '#content-holder',
        contentType    : 'payrollStructureType',
        template       : _.template(CreateTemplate),
        elementTemplate: _.template(FormulaElementTemplate),
        responseObj    : {},

        initialize: function (options) {
            var self = this;

            self.data = options.data || {};

            self.type = options.type;
            self.eventChannel = options.eventChannel;
            self.updateAfterCreate = options.updateAfterCreate;

            self.seq = (self.data && self.data.formula && self.data.formula.length) || 0;

            self.responseObj['#sumSubDd'] = [
                {
                    _id : 'add',
                    name: '+'
                }, {
                    _id : 'substract',
                    name: '-'
                }
            ];

            self.responseObj['#mulDivDd'] = [
                {
                    _id : 'multiply',
                    name: 'x'
                }, {
                    _id : 'divide',
                    name: '/'
                }
            ];

            // todo fill with real data;
            /* self.responseObj['#operandDd'] = [
             {
             _id : 'const',
             name: 'Constant'
             }, {
             _id : 'other',
             name: 'ref:other'
             }, {
             _id : 'other2',
             name: 'var:other2'
             }, {
             _id : 'other3',
             name: 'var:other3'
             }
             ];*/
            if(self.type == 'earnings'){
                self.responseObj['#operandDd'] = [
                    // {
                    //     _id : 'const',
                    //     name: 'Constant'
                    // }, 
                    {
                        _id : 'base',
                        name: '基础工资'
                    }, {
                        _id : 'overtime',
                        name: '加班工资'
                    }, {
                        _id : 'vacation',
                        name: '假期工资'
                    }
                ];
            }
            else{
                self.responseObj['#operandDd'] = [
                    // {
                    //     _id : 'const',
                    //     name: 'Constant'
                    // }, 
                    {
                        _id : 'absence',
                        name: '缺勤扣款'
                    }, {
                        _id : 'endowmentInsurance',
                        name: '养老保险'
                    }, {
                        _id : 'unemploymentInsurance',
                        name: '失业保险'
                    },{
                        _id : 'medicalInsurance',
                        name: '医疗保险'
                    },{
                        _id : 'housingFund',
                        name: '住房公积金'
                    },{
                        _id : 'attendance',
                        name: '考勤扣款'
                    },{
                        _id : 'other',
                        name: '其他扣款'
                    },
                ];
            }
            self.mapValues = {};

            Object.keys(self.responseObj).forEach(function (ddElement) {
                var val = {};
                self.responseObj[ddElement].forEach(function (el) {
                    val[el._id] = el.name;
                });
                self.mapValues[ddElement] = val;
            });

            self.render();
        },

        events: {
            'click #addFormulaElement': 'addFormulaElement',
            'click .icon-trash'       : 'removeEl',
            'click #range'            : 'toggleRange'
        },

        removeEl: function (e) {

            e.preventDefault();
            e.stopPropagation();

            $(e.target).closest('div.formulaElement').remove();
        },

        toggleRange: function () {

            this.$el.find('.maxRange').toggle();
            this.$el.find('.minRange').toggle();

        },

        addFormulaElement: function (e) {
            var self = this;

            e.preventDefault();
            e.stopPropagation();

            $('#formula').append(self.elementTemplate({seq: self.seq++}));
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
            var $currentEl = this.$el;
            var name = $.trim($currentEl.find('#structureComponentName').val());
            var data = self.data;
            var err;
            var model;

            if (self.type[self.type.length - 1] !== 's') {
                self.type += 's';
            }

            data.name = name;
            data.type = self.type;
            data.formula = [];
            data.minRange = $.trim($currentEl.find('#minRange').val());
            data.maxRange = $.trim($currentEl.find('#maxRange').val());

            if (!name) {
                err = '名称字段不能为空';
            }

            $('.formulaElement').each(function () {
                var $element = $(this);
                var element = {};
                var seq = $element.attr('data-seq');

                element.prefix = $.trim($element.find('#sumSubDd').attr('data-id'));
                element.operand = $.trim($element.find('#operandDd').attr('data-id'));
                element.operation = $.trim($element.find('#mulDivDd').attr('data-id'));
                element.ratio = $.trim($element.find('#ratio').val());

                if (!element.operand) {
                    err = '必须选择操作符号';
                }

                data.formula[seq] = element;
            });

            if (err) {
                return App.render({
                    type   : 'error',
                    message: err
                });
            }

            model = new PayrollComponentTypeModel();
            model.urlRoot = function () {
                return 'payrollComponentTypes';
            };

            model.save(data, {
                patch  : true,
                success: function (model) {
                    self.remove();

                    self.eventChannel.trigger('newStructureComponent', data, model);

                    if (self.updateAfterCreate) {
                        self.eventChannel.trigger('updatePayrollDeductionsType', data, model);
                        self.eventChannel.trigger('updatePayrollEarningsType', data, model);
                    }
                    if (self.collection) {
                        self.collection.add(model, {remove: false});
                    }
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        hideDialog: function () {
            $('.create-structureElement-dialog').remove();
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

            $formula.find('a').first().hide();
        },

        render: function () {
            var self = this;
            var data = self.data;
            var type = self.type;
            var url;
            var ddId;

            var formString = self.template({
                type         : type,
                name         : data.name,
                componentType: data.componentType
            });
            var buttons = [
                {
                    class: 'btn',
                    text : '取消',
                    click: function () {
                        self.hideDialog();
                    }
                }];

            if (data.name) {
                buttons.unshift(
                    {
                        id   : 'create-weeklyScheduler-dialog',
                        class: 'btn blue',
                        text : '更新',
                        click: function () {
                            self.saveItem();
                        }
                    }
                );
            } else {
                buttons.unshift(
                    {
                        id   : 'create-weeklyScheduler-dialog',
                        class: 'btn blue',
                        text : '创建',
                        click: function () {
                            self.saveItem();
                        }
                    }
                );
            }

            self.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'create-structureElement-dialog',
                title        : 'Create WeeklyScheduler',
                width        : '800px',
                position     : {within: $('#wrapper')},
                buttons      : buttons

            });

            if(self.type == 'earnings'){
                dataService.getData('/personExternal/getForDd', {}, function(res){
                    function decroteAllArray(r) {
                        switch (r) {
                            case '住房补贴': return {
                                "_id": 'housingAdd',
                                "name": r
                            }
                            break;
                            case '通讯补贴': return{
                                "_id": 'communication',
                                "name": r
                            }
                            break;
                            case '餐费补贴': return{
                                "_id": 'meal',
                                "name": r
                            }
                            break;
                            case '职称补贴': return{
                                "_id": 'jobTitle',
                                "name": r
                            }
                            break;
                            default:
                                return{
                                "_id": encodeURI(r),
                                "name": r
                            }
                            break;

                        }
                    }
                    var allArray = res.map(r => r.allowanceName);
                    // var allArray = res.map(function(r){
                    //     return r.allowanceName;
                    // });
                    allArray = $.unique(allArray).map(r => decroteAllArray(r));
                    // allArray = $.unique(allArray).map(function(r){
                    //     return decroteAllArray(r);
                    // });
                    console.log(allArray);
                    var operandDd = self.responseObj['#operandDd'];
                    self.responseObj['#operandDd'] = $.unique($.merge(allArray, operandDd));
                });
            }

            else{
                dataService.getData('/personDeduction/getForDd', {}, function(res){
                    function decroteAllArray(r) {
                            switch (r) {
                            case '缺勤扣款': return {
                                "_id": 'absence',
                                "name": r
                            }
                            break;
                            case '养老保险': return{
                                "_id": 'endowmentInsurance',
                                "name": r
                            }
                            break;
                            case '失业保险': return{
                                "_id": 'unemploymentInsurance',
                                "name": r
                            }
                            break;
                            case '医疗保险': return{
                                "_id": 'medicalInsurance',
                                "name": r
                            }
                            break;
                            case '住房公积金': return{
                                "_id": 'housingFund',
                                "name": r
                            }
                            break;
                            case '考勤扣款': return{
                                "_id": 'attendance',
                                "name": r
                            }
                            break;
                            case '其他扣款': return{
                                "_id": 'other',
                                "name": r
                            }
                            break;
                            default:
                                return{
                                "_id": encodeURI(r),
                                "name": r
                            }
                            break;

                        }
                    }
                    var allArray = res.map(r => r.deductionName);
                    // var allArray = res.map(function(r){
                    //     return r.deductionName;
                    // });
                    allArray = $.unique(allArray).map(r => decroteAllArray(r));
                    // allArray = $.unique(allArray).map(function(r){
                    //     return decroteAllArray(r);
                    // });
                    console.log(allArray);
                    var operandDd = self.responseObj['#operandDd'];
                    self.responseObj['#operandDd'] = $.unique($.merge(allArray, operandDd));
                });
            }

            self.renderFormula();



            /* url = '/payrollComponentTypes/forDd/' + type + 's';
             ddId = '#' + type + 'TypeDd';

             populate.get(ddId, url, {}, 'name', self);*/

            self.delegateEvents(this.events);

            return self;
        }

    });

    return CreateView;
});
