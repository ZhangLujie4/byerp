define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/DesignBook/form/FormTemplate.html',
    'views/selectView/selectView',
    'views/Editor/AttachView',
    'common',
    'populate',
    'custom',
    'dataService',
    'async',
    'helpers',
    'constants',
    'views/Assignees/AssigneesView'
], function (Backbone,
             $,
             _,
             ProjectsFormTemplate,
             selectView,
             AttachView,
             common,
             populate,
             custom,
             dataService,
             async,
             helpers,
             CONSTANTS,
             AssigneesView) {
    'use strict';

    var View = Backbone.View.extend({
        el               : '#content-holder',
        contentType      : 'DesignBook',

        events: {
            'click .chart-tabs'                                                                    : 'changeTab',
            'click .newSelectList li:not(.miniStylePagination):not(.disabled)'                     : 'chooseOption',
            'click .current-selected:not(.disabled)'                                               : 'showNewSelect',
            'change input:not(.checkbox, .checkAll, .statusCheckbox, #inputAttach, #noteTitleArea)': 'showSaveButton',
            'change #note'                                                                     : 'showSaveButton',
            click                                                                                  : 'hideSelect',
            keydown                                                                                : 'keydownHandler',
            'click #other': 'createOther'
        },

        initialize: function (options) {

            this.formModel = options.model;
            this.formModel.urlRoot = '/DesignBook/';
            this.responseObj = {};
            this.responseObj['#texture'] = [
                {
                    _id : 'BL',
                    name: '玻璃'
                }, {
                    _id : 'JS',
                    name: '金属'
                },{
                    _id : 'SCMQ',
                    name: '石材幕墙'
                },{
                    _id : 'RZBC',
                    name: '人造板材'
                },{
                    _id : 'QTXSMQ',
                    name: '其他新式幕墙'
                }

            ];
            this.responseObj['#structure'] = [
                {
                    _id : 'DYS',
                    name: '单元式'
                }, {
                    _id : 'GF',
                    name: '光伏'
                },{
                    _id : 'GJG',
                    name: '钢结构'
                },{
                    _id : 'SC',
                    name: '双层'
                },
                {
                    _id : 'QTJG',
                    name: '其他结构'}

            ];
            this.responseObj['#conceptualPicture'] = [
                {
                    _id : 'ATBWJ',
                    name: '按投标文件'
                }, {
                    _id : 'ABZWJ',
                    name: '按编制文件'
                }

            ];
            this.responseObj['#constructPicture'] = [
                {
                    _id : 'ATBWJ',
                    name: '按投标文件'
                }, {
                    _id : 'ABZWJ',
                    name: '按编制文件'
                }

            ];
            this.responseObj['#expenseDepartment'] = [
                {
                    _id : 'GSYWBM',
                    name: '公司业务部门'
                }, {
                    _id : 'QT',
                    name: '其他'
                }

            ];
            this.responseObj['#designContractType'] =[
                {
                    _id:'WBSJHT',
                    name:'外部设计合同'
                },
                {
                    _id:'XMBSJHT',
                    name:'项目部设计合同'
                }
            ]

        },

        createOther:function () {
            var others = document.getElementById("others");
            var a= this.$el.find('#other').is(':checked');
            if(a) {
                others.innerHTML = "<input  id='otherss' type='text' style='width: 200px'  />"
            }else{others.innerHTML=""}
            this.showSaveButton();

        },

        showRemoveButton: function (e) {
            var target = e.target;
            var tr = $(target).parents('tr');
            var removeItem = tr.find('.fa.fa-trash').not('.notRemovable');

            removeItem.removeClass('hidden');
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

            this.selectView = new selectView({
                e          : e,
                responseObj: this.responseObj
            });

            $target.append(this.selectView.render().el);

            return false;
        },

        saveItem: function () {
            var $thisEl = this.$el;
            var self = this;
            var mid = 39;
            var name = $thisEl.find('#projectName').data('id')||null;
            var number=$.trim($thisEl.find('#projectNumber').val());
            var designLeader=$thisEl.find('#designLeader').data('id')||null;
            var designDepartment=$thisEl.find('#designDepartment').attr('data-id')||null;
            var designContractType=$thisEl.find('#designContractType').attr('data-id');
            var customer = $thisEl.find('#customerDd').data('id')||null;
            var amount= $.trim(this.$el.find('#amount').val());
            var accountReceivable= $.trim(this.$el.find('#accountReceivable').val());
            var accountReceived= $.trim(this.$el.find('#accountReceived').val());
            var invoiceAccountReceivable= $.trim(this.$el.find('#invoiceAccountReceivable').val());
            var expenseDepartment;
            expenseDepartment=this.$el.find('#expenseDepartment').data('id');
            if(expenseDepartment=="QT"){
                var otherDepartment=$.trim(this.$el.find('#expenseDepartmentss').val())
            }
            var designDate = $.trim(this.$el.find('#designDate').val());
            var door;
            var wall;
            var other;
            var requireType=[];
            var texture= $thisEl.find('#texture').data('id');
            var structure= this.$el.find('#structure').data('id');
            var constructPicture= this.$el.find('#constructPicture').data('id');
            var conceptualPicture= this.$el.find('#conceptualPicture').data('id');
            if(structure=="QTJG"){
                var otherStructure=$.trim(this.$el.find('#structureOthers').val())
            }
            door = $thisEl.find('#door').is(':checked');
            wall = $thisEl.find('#wall').is(':checked');
            other = $thisEl.find('#other').is(':checked');
            if(door){
                requireType.push("door")
            }
            if(wall){
                requireType.push("wall")
            }
            if(other){
                var otherType=$.trim(this.$el.find('#otherss').val());
                requireType.push("other")
            }
            var pushDate=$.trim(this.$el.find('#pushDate').val());
            var effectPicture=[];
            var perspective;
            var bird;
            var node;
            perspective = $thisEl.find('#perspective').is(':checked');
            bird = $thisEl.find('#bird').is(':checked');
            node = $thisEl.find('#node').is(':checked');
            if(perspective){
                effectPicture.push("perspective")
            }
            if(bird){
                effectPicture.push("bird")
            }
            if(node){
                effectPicture.push("node")
            }
            var pushRequire=$.trim(this.$el.find('#pushRequire').val());
            var whoCanRW = $thisEl.find("[name='whoCanRW']:checked").val();
            var usersId = [];
            var groupsId = [];
            $thisEl.find('.groupsAndUser tr').each(function () {
                if ($(this).data('type') === 'targetUsers') {
                    usersId.push($(this).data('id'));
                }
                if ($(this).data('type') === 'targetGroups') {
                    groupsId.push($(this).data('id'));
                }

            });
            var data = {
                projectName                : name,
                projectNumber              : number,
                designLeader               : designLeader,
                designDepartment           : designDepartment,
                designContractType         : designContractType,
                customer                   : customer,
                amount                     : amount,
                invoiceAccountReceivable   : invoiceAccountReceivable,
                accountReceived            : accountReceived,
                accountReceivable          : accountReceivable,
                expenseDepartment          : expenseDepartment,
                otherDepartment            : otherDepartment,
                designDate                 : designDate,
                designType:{
                    requireType:requireType,
                    otherType:otherType,
                    texture:texture,
                    structure:structure,
                    otherStructure:otherStructure
                },
                designRequire:{
                    pushDate:pushDate,
                    effectPicture:effectPicture,
                    conceptualPicture:conceptualPicture,
                    constructPicture:constructPicture,
                    pushRequire:pushRequire
                },
                groups: {
                    owner: $thisEl.find('#allUsersSelect').attr('data-id') || null,
                    users: usersId,
                    group: groupsId
                },

                whoCanRW: whoCanRW

            };

            this.formModel.save(data, {
                patch  : true,
                headers: {
                    mid: mid
                },

                success: function () {

                    self.hideSaveButton();

                    App.render({
                        type   : 'notify',
                        message: '数据已经更新，请刷新页面！'
                    });
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }

            });

        },

        chooseOption: function (e) {
            var id;
            var data;
            var $target = $(e.target);

            $('.newSelectList').hide();

            if ($target.parents('dd').find('.current-selected').length) {
                $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            }
            var $thisEl = this.$el;
            var sel=$(e.target).parents('dd').find('.current-selected')

            if(sel.context.id==='QT'||sel.context.id==='GSYWBM') {
                var expenseDepartments = document.getElementById("expenseDepartments");
                var exp = $thisEl.find('#expenseDepartment').attr('data-id');
                if (exp == 'QT') {
                    expenseDepartments.innerHTML = "<input  id='expenseDepartmentss' style='width: 200px' type='text' />"
                } else {
                    expenseDepartments.innerHTML = ""
                }
            }
            if(sel.context.id==='QTJG'||sel.context.id==='DYS'||sel.context.id==='GF'||sel.context.id==='GJG'||sel.context.id==='SC') {
                var struct = document.getElementById("structureOther");
                var str = $thisEl.find('#structure').attr('data-id');
                if (str == 'QTJG') {
                    struct.innerHTML = "<input  id='structureOthers' style='width: 200px' type='text'  />"
                } else {
                    struct.innerHTML = ""
                }
            }
            this.showSaveButton();
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

        changeTab: function (e) {
            var target = $(e.target);
            var $aEllement = target.closest('a');
            var n;
            var dialogHolder;

            target.closest('.chart-tabs').find('a.active').removeClass('active');
            $aEllement.addClass('active');
            n = target.parents('.chart-tabs').find('li').index($aEllement.parent());
            dialogHolder = $('.dialog-tabs-items');
            dialogHolder.find('.dialog-tabs-item.active').removeClass('active');
            dialogHolder.find('.dialog-tabs-item').eq(n).addClass('active');
        },

        keydownHandler: function (e) {
            switch (e.which) {
                case 13:
                    this.showSaveButton();
                    break;
                default:
                    break;
            }
        },

        showSaveButton: function () {
            $('#top-bar-saveBtn').show();
        },

        hideSaveButton:function () {
            $('#top-bar-saveBtn').remove();
        },

        deleteItems: function () {
            var mid = 39;
            var answer;
            answer = confirm('真的要删除么 ?!');

            if(answer===true){

                this.formModel.urlRoot = '/DesignBook';
                this.formModel.destroy({
                    headers: {
                        mid: mid
                    },
                    success: function () {
                        Backbone.history.navigate('#easyErp/DesignBook/list', {trigger: true});
                    }
                });}

        },

        render: function () {
            var formModel = this.formModel.toJSON();
            var templ = _.template(ProjectsFormTemplate);
            var self = this;
            var $thisEl = this.$el;
            var assignees;

            $thisEl.html(templ({
                model        : formModel
            }));


            populate.get2name('#customerDd', CONSTANTS.URLS.CUSTOMERS, {}, this, false, false);
            populate.get2name('#designLeader', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false, false);
            populate.get('#designDepartment', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, false, false);
            dataService.getData('/Opportunities/getForDd', {}, function(response, context){
                context.responseObj['#projectName'] = response.data;
            },this);

            assignees = $thisEl.find('#assignees-container');
            assignees.html(
                new AssigneesView({
                    model: this.formModel
                }).render().el
            );

            $('#createOutAndDepartmentProject').remove();
            $('#createInAndRecordProject').remove();

            $thisEl.find('#pushDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                onSelect   : function () {
                    self.showSaveButton();
                }
            });
            $thisEl.find('#designDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                onSelect   : function () {
                    self.showSaveButton();
                }
            });

            return this;

        }
    });

    return View;
});
