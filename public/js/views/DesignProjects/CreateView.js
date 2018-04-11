define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/DesignProjects/CreateTemplate.html',
    'models/DesignProjectsModel',
    'views/Notes/AttachView',
    'views/Bonus/BonusView',
    'services/projects',
    'populate',
    'custom',
    'constants',
    'dataService',
    'common'
], function (Backbone, $, _, ParentView, CreateTemplate, ProjectModel, AttachView, BonusView, projects, populate, customFile, CONSTANTS,dataService,common) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'Projects',
        template   : _.template(CreateTemplate),

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.type=options.type;
            this.model = new ProjectModel();
            this.responseObj = {};

            /*this.responseObj['#texture'] = [
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
            if(this.type=='createOutAndDepartment'){
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
            }else {
                this.responseObj['#designContractType'] =[
                    {
                        _id:'NBSJHT',
                        name:'内部设计合同'
                    },
                    {
                        _id:'SJBAHT',
                        name:'设计备案合同'
                    }
                ]
            }*/
            this.responseObj['#designContractType'] =[
                {
                    _id:'NBSJHT',
                    name:'内部设计合同'
                },
                {
                    _id:'SJBAHT',
                    name:'设计备案合同'
                }
            ]
            this.render();
        },

        events: {
           // 'click #other'                                                            : 'createOther'
        },


        /*createOther:function () {
            var others = document.getElementById("others");
            if(others.innerHTML=="") {
                others.innerHTML = "<input  id='otherss' type='text' style='width: 100px'  />"
            }else{others.innerHTML=""}

        },*/

        chooseOption: function (e) {
            $(e.target).parents('dd').find('.current-selected').text($(e.target).text()).attr('data-id', $(e.target).attr('id'));
            /*var $thisEl = this.$el;
            var sel=$(e.target).parents('dd').find('.current-selected');

            if(sel.context.id==='QT'||sel.context.id==='GSYWBM') {
                var expenseDepartments = document.getElementById("expenseDepartments");
                var exp = $thisEl.find('#expenseDepartment').attr('data-id');
                if (exp == 'QT') {
                    expenseDepartments.innerHTML = "<input  id='expenseDepartmentss' style='width: 100px' type='text' />"
                } else {
                    expenseDepartments.innerHTML = ""
                }
            }
            if(sel.context.id==='QTJG'||sel.context.id==='DYS'||sel.context.id==='GF'||sel.context.id==='GJG'||sel.context.id==='SC') {
                var struct = document.getElementById("structureOther");
                var str = $thisEl.find('#structure').attr('data-id');
                if (str == 'QTJG') {
                    struct.innerHTML = "<input  id='structureOthers' style='width: 100px' type='text'  />"
                } else {
                    struct.innerHTML = ""
                }
            }*/
        },

        saveItem: function () {
            var self = this;
            var $thisEl = this.$el;
            var mid = 39;
            var message;
            var usersId=[];
            var groupsId=[];
           /* var door;
            var wall;
            var other;
            var requireType=[];
            var expenseDepartment=$.trim(this.$el.find('#expenseDepartment').data('id'));
            if(expenseDepartment=="QT"){
                var otherDepartment=$.trim(this.$el.find('#expenseDepartmentss').val())
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
            var texture=$.trim(this.$el.find('#texture').data('id'));
            var structure=$.trim(this.$el.find('#structure').data('id'));
            if(structure=="QTJG"){
                var otherStructure=$.trim(this.$el.find('#structureOthers').val())

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
            var conceptualPicture=$.trim(this.$el.find('#conceptualPicture').data('id'));
            var constructPicture=$.trim(this.$el.find('#constructPicture').data('id'));
            var pushRequire=$.trim(this.$el.find('#pushRequire').val());*/
            var signedDate = $.trim(this.$el.find('#signedDate').val());
            var archDate = $.trim(this.$el.find('#archDate').val());
            var designDepartment=$thisEl.find('#designDepartment').attr('data-id');
            var customer = $thisEl.find('#customerDd').attr('data-id');
            var designContractType=$.trim(this.$el.find('#designContractType').data('id'));
            var projectName=$.trim(this.$el.find('#projectName').data('id'))||null;
            var name=$.trim(this.$el.find('#projectName').text());
            var amount=$.trim(this.$el.find('#amount').val());
            var archiveMan=$.trim(this.$el.find('#archiveMan').data('id'))||null;
            var note=$.trim(this.$el.find('#note').val());
           // var designLeader=$.trim(this.$el.find('#designLeader').data('id'))||null;
            var number=$.trim(this.$el.find('#projectNumber').val());
            var whoCanRW = this.$el.find("[name='whoCanRW']:checked").val();
            $thisEl.find('.groupsAndUser tr').each(function () {
                if ($(this).data('type') === 'targetUsers') {
                    usersId.push($(this).data('id'));
                }
                if ($(this).data('type') === 'targetGroups') {
                    groupsId.push($(this).data('id'));
                }

            });
            if(!projectName){
                return App.render({
                    type   : 'error',
                    message: '请选择项目名称!'
                })
            }
            if(!number){
                return App.render({
                    type   : 'error',
                    message: '请填写合同编号!'
                })
            }
            if(!customer){
                message=(designContractType=='WBSJHT'||designContractType=='XMBSJHT')?'请选择委托方！':'请选择设计委托单位！';
                return App.render({
                    type   : 'error',
                    message: message
                })
            }
            if(!amount){
                message=(designContractType=='WBSJHT'||designContractType=='XMBSJHT')?'请填写设计费用！':'请填写合同金额！';
                return App.render({
                    type   : 'error',
                    message: message
                })
            }
            if((designContractType=='WBSJHT'||designContractType=='XMBSJHT')&& !designLeader){
                return App.render({
                    type   : 'error',
                    message: '请选择设计负责人!'
                })
            }

            this.model.save({
                name                   :name,
                projectName            :projectName,
                customer               :customer ,
                designDepartment       :designDepartment,
                amount                 :amount,
                signedDate             :signedDate,
                archDate               :archDate,
                archiveMan             :archiveMan,
                note                   :note,
                designContractType     :designContractType,
                //designLeader           :designLeader,
                projectNumber          :number,
               /* designRequire:{
                    pushDate:pushDate,
                    effectPicture:effectPicture,
                    conceptualPicture:conceptualPicture,
                    constructPicture:constructPicture,
                    pushRequire:pushRequire
                },
                designType:{
                    requireType:requireType,
                    otherType:otherType,
                    texture:texture,
                    structure:structure,
                    otherStructure:otherStructure
                },
                expenseDepartment      :expenseDepartment,
                otherDepartment        :otherDepartment*/
                groups          : {
                    owner: self.$el.find('#allUsersSelect').attr('data-id') || null,
                    users: usersId,
                    group: groupsId
                }
            }, {
                headers: {
                    mid: mid
                },
                wait   : true,
                success: function (model) {
                    var url = window.location.hash;

                    Backbone.history.fragment = '';

                    Backbone.history.navigate(url, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },

        render: function () {
            var formString = this.template({type:this.type});
            var self = this;
            var $thisEl;
            var model=new ProjectModel();

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog',
                width        : '900',
                title        : 'Create Project',
                buttons      : {
                    save: {
                        text : '新建',
                        class: 'btn blue',
                        click: function () {
                            self.saveItem();
                        }
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }
                }
            });

            $thisEl = this.$el;


            populate.get2name('#customerDd', CONSTANTS.URLS.CUSTOMERS, {}, this, false, false);
            populate.get2name('#archiveMan', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false, false);
            populate.get2name('#designLeader', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false, false);
            populate.get('#designDepartment', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, false, false);
            dataService.getData('/Opportunities/getForDd', {}, function(response, context){
                context.responseObj['#projectName'] = response.data;
            },this);

            this.renderAssignees(model);

            $thisEl.find('#pushDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });
            $thisEl.find('#signedDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });
            $thisEl.find('#archDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']

            });
            return this;
        }

    });

    return CreateView;
});
