define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/contract/PurchaseContract/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Editor/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'text!templates/contract/PurchaseContract/product/products.html',
    'text!templates/contract/PurchaseContract/product/productsEdit.html',
    'views/contract/PurchaseContract/ProductItems',
    'helpers',
    'dataService'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             selectView,
             NoteView,
             AttachView,
             common,
             populate,
             custom,
             CONSTANTS,
             Products,
             productsEdit,
             ProductItemView,
             helpers,dataService) {

    var EditView = ParentView.extend({
        contentType: 'PurchaseContract',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated'             : 'isNumberKey',
            'click #projectTopName'                    : 'useProjectFilter',
            'click .addProductItem a'                  : 'getItem',
            'click .removeJob'                         : 'deleteRow',
            'click .addCarriage a'                     : 'addCarriage'
        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'saveItem', 'deleteItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.attributes.task.products=this.currentModel.attributes.products;
            this.currentModel.attributes=this.currentModel.attributes.task;
            this.currentModel.changed=this.currentModel.changed.task;
            this.currentModel.id=this.currentModel.changed._id;
            this.currentModel.urlRoot = CONSTANTS.URLS.PURCHASECONTRACT;
            this.responseObj['#sealType'] = [
                {
                    _id : 'GZ',
                    name: '公章'
                }, {
                    _id : 'HTZYZ',
                    name: '合同专用章'
                }

            ];
            this.responseObj['#preAmountType'] = [
                {
                    _id : 'HQHKZBZKC',
                    name: '后期货款中不做扣除'
                }, {
                    _id : 'SCFKZKC',
                    name: '首次付款中扣除'
                },
                {
                    _id : 'TBLKC',
                    name: '同比例扣除'
                },
                {
                    _id : 'WKZKC',
                    name: '尾款中扣除'
                }

            ];
            /*this.responseObj['#paymentType'] = [
                {
                    _id : 'DPAYAJE',
                    name: '单批按月,按金额'
                }, {
                    _id : 'DPAYASL',
                    name: '单批按月,按数量'
                },
                {
                    _id : 'DPAJDAJE',
                    name: '单批按节点,按金额'
                },
                {
                    _id : 'DPAJDASL',
                    name: '单批按节点,按数量'
                }

            ];
            this.responseObj['#payType'] = [
                {
                    _id : 'NDZF',
                    name: '年底支付'
                }, {
                    _id : 'AZWCZF',
                    name: '安装完成支付'
                },
                {
                    _id : 'YSHGZF',
                    name: '验收合格支付'
                },
                {
                    _id : 'ZBJ',
                    name: '质保金'
                }

            ];
            this.responseObj['#carriage'] = [
                {
                    _id : 'AJE',
                    name: '按金额'
                }, {
                    _id : 'ADHDD',
                    name: '按到货地点'
                }


            ];
            this.responseObj['#quota'] = [
                {
                    _id : 'ACL',
                    name: '按材料'
                }, {
                    _id : 'ADW',
                    name: '按单位'
                },
                {
                    _id : 'AJE',
                    name: '按金额'
                }
            ];*/

            this.render();
        },

        createProductView: function () {
            var productItemContainer;

            productItemContainer = this.$el.find('#productItemsHolder');

            productItemContainer.append(
                new ProductItemView({canBeSold: false, quotations: true}).render().el)

        },

        useProjectFilter: function (e) {
            var project;
            var filter;

            e.preventDefault();
            project = this.currentModel.get('project')._id;
            filter = {
                project: {
                    key  : 'project._id',
                    type : 'ObjectId',
                    value: [project]
                }
            };

            $('.edit-dialog').remove();

            Backbone.history.navigate('#easyErp/PurchaseContract/list/p=1/c=100/filter=' + encodeURIComponent(JSON.stringify(filter)), {trigger: true});
        },

        isNumberKey: function (evt) {
            var charCode = (evt.which) ? evt.which : event.keyCode;

            return !(charCode > 31 && (charCode < 48 || charCode > 57));
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var endElem = target.parents('dd').find('.current-selected');

            endElem.text(target.text()).attr('data-id', target.attr('id'));
            endElem.attr('data-shortdesc', target.data('level'));
        },

        getItem:function(e){

            var target = $(e.target);
            var $parrent = target.closest('tbody');
            var templ = _.template(Products);
            var $trEll = $parrent.find('tr.productItem');
            var products = this.products ? this.products.toJSON() : [];
            e.preventDefault();
            e.stopPropagation();
            if(!$trEll.length){
                $parrent.prepend(templ({
                    products     : products
                }));
            }
            $($trEll[$trEll.length - 1]).after(templ({
                products     : products
            }));

            return false;
        },

        deleteRow: function (e){
            var target = $(e.target);
            var tr = target.closest('tr');
            tr.remove();

        },

        saveItem: function (event) {
            var self = this;
            var holder;
            var mid;
            var project;
            var workflow;
            var data;
            var currentWorkflow;
            var currentProject;
            event.preventDefault();
            holder = this.$el;
            mid = 39;

            project = holder.find('#projectDd').data('id');
            workflow = holder.find('#workflowsDd').data('id');

            var thisEl = this.$el;
            var selectedproducts = thisEl.find('.productItem');
            var products=[];
            var selectedLength = selectedproducts.length;
            var targetEl;
            var productId;
            var i;
            var subTotal;
            for (i = selectedLength - 1; i >= 0; i--) {
                targetEl = $(selectedproducts[i]);
                productId = targetEl.data('id');
                var quantity = targetEl.find('[data-name="quantity"] input').val();
                var unitPrice = targetEl.find('[data-name="price"] input').val()*100;
                //var processingCharges = targetEl.find('[data-name="processingCharges"] input').val()*100;
                var qty1 = targetEl.find('.qty1').val();
                var qty2 = targetEl.find('.qty2').val();
                var qty3 = targetEl.find('.qty3').val();
                var qty4 = targetEl.find('.qty4').val();
                var qty5 = targetEl.find('.qty5').val();
                var price1 = targetEl.find('#price1').val();
                var price2 = targetEl.find('#price2').val();
                var price3 = targetEl.find('#price3').val();
                var price4 = targetEl.find('#price4').val();
                var price5 = targetEl.find('#price5').val();
                var sourceAl = targetEl.find('#alumSource').data('id');

                subTotal = helpers.spaceReplacer(targetEl.find('.subtotal').text());
                subTotal = parseFloat(subTotal) * 100;
                products.push({
                    product         : productId,
                    quantity        : quantity,
                    unitPrice       : unitPrice,
                    subTotal        : subTotal,
                    qty1            : qty1,
                    qty2            : qty2,
                    qty3            : qty3,
                    qty4            : qty4,
                    qty5            : qty5,
                    price1          : price1,
                    price2          : price2,
                    price3          : price3,
                    price4          : price4,
                    price5          : price5,
                    sourceAl        : sourceAl
                });
            }
            var productsTotal=helpers.spaceReplacer($.trim(thisEl.find('#totalAmount').text()));
            productsTotal = parseFloat(productsTotal) * 100;

            var preAmountType = this.$el.find('#preAmountType').data('id');
            var preAmountMold=this.$el.find("[name='preAmount']:checked").data('id');
            var preAmountNumber;
            if(preAmountMold=='preAmountRateLabel') {
                preAmountNumber = $.trim(this.$el.find('#preAmountRate').val()) ;
            }else{
                preAmountNumber =  $.trim(this.$el.find('#preAmountAll').val());
            }
            var preAmountTypeModel={
                payType:preAmountType,
                mold:preAmountMold,
                number:preAmountNumber
            };


            var paymentType = this.$el.find("[name='paymentType']:checked").data('id');
            var monthRate=$.trim(this.$el.find('#paymentTypeByMonthRate').val());
            var paymentTypeByAmount=this.$el.find("[name='paymentTypeBranch']:checked").data('id')||null;
            var paymentTypeNumber1;
            var paymentTypeNumber2;
            if(paymentTypeByAmount=='paymentTypeByAmount') {
                paymentTypeNumber1 = $.trim(this.$el.find('#paymentTypeByAmountNumber').val());
                paymentTypeNumber2 = $.trim(this.$el.find('#paymentTypeByAmountRate').val());
            }else{
                paymentTypeNumber1 = $.trim(this.$el.find('#paymentTypeByQuantityNumber').val());
                paymentTypeNumber2 = $.trim(this.$el.find('#paymentTypeByQuantityRate').val());
            }
            var paymentTypeModel={
                mold:paymentType,
                monthNumber:monthRate,
                nodeType:paymentTypeByAmount,
                number1:paymentTypeNumber1,
                number2:paymentTypeNumber2
            };

            var payType=[];
            var payTypeDate;
            var total=0;
            var NDZF = this.$el.find('#NDZF').is(':checked');
            if(NDZF){
                var NDZFRate=$.trim(this.$el.find('#NDZFRate').val());
                payTypeDate={};
                payTypeDate.mold='NDZF';
                payTypeDate.number=NDZFRate;
                total=total+NDZFRate*1;
                payType.push(payTypeDate)
            }
            var AZWCZF = this.$el.find('#AZWCZF').is(':checked');
            if(AZWCZF){
                var AZWCZFRate=$.trim(this.$el.find('#AZWCZFRate').val());
                payTypeDate={};
                payTypeDate.mold='AZWCZF';
                payTypeDate.number=AZWCZFRate;
                total=total+AZWCZFRate*1;
                payType.push(payTypeDate)
            }
            var YSHGZF = this.$el.find('#YSHGZF').is(':checked');
            if(YSHGZF){
                var YSHGZFRate=$.trim(this.$el.find('#YSHGZFRate').val());
                payTypeDate={};
                payTypeDate.mold='YSHGZF';
                payTypeDate.number=YSHGZFRate;
                total=total+YSHGZFRate*1;
                payType.push(payTypeDate)
            }
            var ZBJ = this.$el.find('#ZBJ').is(':checked');
            if(ZBJ){
                var ZBJRate=$.trim(this.$el.find('#ZBJRate').val());
                payTypeDate={};
                payTypeDate.mold='ZBJ';
                payTypeDate.number=ZBJRate;
                total=total+ZBJRate*1;
                payType.push(payTypeDate)
            }
            if(total>100){
                return App.render({
                    type   : 'error',
                    message: '所有附加条件数值相加不得大于100!'
                })
            }

            var carriage = this.$el.find("[name='carriage']:checked").data('id');
            var byAmount=[];
            if(carriage=='carriageByAmount'){
                var carriageList=thisEl.find('.carriageList');
                var carriageLength=carriageList.length;

                for (i = carriageLength - 1; i >= 0; i--) {
                    targetEl = $(carriageList[i]);
                    var number1 = targetEl.find('#carriageByAmountRange1').val();
                    var number2 = targetEl.find('#carriageByAmountRange2').val();
                    var number3 = targetEl.find('#carriageByAmountRange3').val();

                    byAmount.push({
                        number1         : number1,
                        number2         : number2,
                        number3         : number3
                    });
                }
            }

            var byAddress=[];
            if(carriage=='carriageByAddress'){
                var AddressCompany = this.$el.find('#AddressCompany').is(':checked');
                var AddressConstruction = this.$el.find('#AddressConstruction').is(':checked');
                var byAddressData;
                if(AddressCompany){
                    byAddressData={};
                    byAddressData.addressType='AddressCompany';
                    byAddressData.addressTypes=this.$el.find("[name='AddressCompanyType']:checked").data('id');
                    if(byAddressData.addressTypes=='AddressCompanyDP') {
                        byAddressData.addressNumber = $.trim(this.$el.find('#AddressCompanyDPAmount').val());
                    }else{
                        byAddressData.addressNumber = $.trim(this.$el.find('#AddressCompanyDWSLAmount').val());
                    }
                    byAddress.push(byAddressData)
                }
                if(AddressConstruction){
                    byAddressData={};
                    byAddressData.addressType='AddressConstruction';
                    byAddressData.addressTypes=this.$el.find("[name='AddressConstructionType']:checked").data('id');

                    if(byAddressData.addressTypes=='AddressConstructionDP') {
                        byAddressData.addressNumber = $.trim(this.$el.find('#AddressConstructionDPAmount').val());
                    }else{
                        byAddressData.addressNumber = $.trim(this.$el.find('#AddressConstructionDWSLLAmount').val());
                    }
                    byAddress.push(byAddressData)
                }
            }
            var carriageModel={
                mold:carriage,
                byAmount:byAmount,
                byAddress:byAddress
            };


            var quota = this.$el.find('#quota').is(':checked');
            if(quota){
                var quotaNumber=$.trim(this.$el.find('#quotaNumber').val());
                var quotaUnit=$.trim(this.$el.find('#quotaUnit').val());
                var quotaAccount=$.trim(this.$el.find('#quotaAccount').val());
            }
            var quotaModel={
                choose:quota,
                number1:quotaNumber,
                number2:quotaUnit,
                number3:quotaAccount
            };

                data = {
                    sealType         : holder.find('#sealType').data('id'),
                    preAmountType    : preAmountTypeModel,
                    paymentType      : paymentTypeModel,
                    payType          : payType,
                    carriage         : carriageModel,
                    quota            : quotaModel,
                    description      : $.trim(holder.find('#descriptions').val()),
                    respons          : $.trim(holder.find('#respons').val()),
                    payTerm          : $.trim(holder.find('#payTerm').val()),
                    payProp          : $.trim(holder.find('#payProp').val()),
                    preAmount        : $.trim(holder.find('#preAmount').val()),
                    taskAmount       : $.trim(holder.find('#taskAmount').val()),
                    quality          : $.trim(holder.find('#quality').val()),
                    violation        : $.trim(holder.find('#violation').val()),
                    note             : $.trim(holder.find('#note').val()),
                    supplier         : holder.find('#supplier').data('id'),
                    products         : products,
                    productsTotal    : productsTotal,
                    signedDate       : $.trim(holder.find('#signedDate').val()),
                    proDate          : $.trim(holder.find('#proDate').val()),
                    proProduct       : $.trim(this.$el.find('#proProduct').val()),
                    workflow         : workflow

                };

            currentWorkflow = this.currentModel.get('workflow');

            if (currentWorkflow && currentWorkflow._id && (currentWorkflow._id !== workflow)) {
                data.workflow = workflow;
                data.sequence = -1;
                data.workflowStart = this.currentModel.toJSON().workflow._id;
            }

            currentProject = this.currentModel.get('project');

            if (currentProject && currentProject._id && (currentProject._id !== project)) {
                data.project = project;
            }

            if (holder.find('#workflowsDd').text() === 'Done') {
                data.progress = 100;
            }

            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                patch  : true,
                success: function (model, res) {

                    self.hideDialog();

                    var url = window.location.hash;

                    Backbone.history.fragment = '';

                    Backbone.history.navigate(url, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        deleteItem: function (event) {
            var mid;
            var self = this;
            var answer;

            event.preventDefault();

            mid = 39;
            answer = confirm('Really DELETE items ?!');

            if (answer === true) {
                this.currentModel.destroy({
                    headers: {
                        mid: mid
                    },
                    success: function (model) {
                        var viewType;
                        var wId;
                        var newTotal;
                        var $totalCount;

                        model = model.toJSON();
                        viewType = custom.getCurrentVT();

                        switch (viewType) {
                            case 'list':
                                $("tr[data-id='" + model._id + "'] td").remove();
                                var url = window.location.hash;

                                Backbone.history.fragment = '';

                                Backbone.history.navigate(url, {trigger: true});
                                break;
                            case 'kanban':
                                $('#' + model._id).remove();
                                // count kanban
                                wId = model.workflow._id;
                                $totalCount = $('td#' + wId + ' .totalCount');

                                newTotal = ($totalCount.html() - 1);
                                $totalCount.html(newTotal);
                        }
                        self.hideDialog();
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            }
        },

        selectProject: function (id) {

            if (id !== '') {
                dataService.getData( CONSTANTS.URLS.PROJECTS_GET_FOR_WTRACK, {
                    _id: id
                }, function (response, context) {
                    var project = response;
                    if (project) {
                        var pro=project.data[0];
                        context.$el.find('#descriptions').val(pro.projectShortDesc);
                        context.$el.find('#pmrDd').val(pro.pmr.name.first+' '+pro.pmr.name.last);
                        context.$el.find('#pmrId').val(pro.pmr._id);
                    }
                }, this);
            } else {
                this.$el.find('#descriptions').val('');
            }

        },
        /*selectBuilding:function (id) {
            if (id !== '') {
                dataService.getData( '/QuotationContract/getBuildingInfo/', {
                    _id: id
                }, function (response, context) {
                    var project = response;
                    context.$el.find('#pmrDd').val(project.pmr);
                }, this);
            } else {
                this.$el.find('#descriptions').val('');
            }
        },*/

        addCarriage:function (e) {
            var target = $(e.target);
            var $parrent = target.closest('tbody');
            var templ = _.template(Products);
            var $trEll = $parrent.find('tr.carriageList');
            e.preventDefault();
            e.stopPropagation();
            if(!$trEll.length){
                $parrent.prepend('<input type="text" >');
            }
            $($trEll[$trEll.length - 1]).after('<tr class="carriageList"><td  colspan="2"  width="50px"></td> <td width="50px" style="text-align: left"> <label for="carriageByAmountRange0" >金额范围：</label> <input type="text" id="carriageByAmountRange1" style="width: 80px"/><i>-</i> <input type="text" id="carriageByAmountRange2" style="width: 80px"/><i>;运费金额</i> <input type="text" id="carriageByAmountRange3" style="width: 80px"/><i>元</i><br> </td><td class="deleteCell centerCell"> <span title="Delete" class="icon-close5 removeJob"></span> </td></tr>');

            return false;
        },

        render: function () {
            var formString = this.template({
                model: this.currentModel.toJSON()
            });
            var self = this;
            var notDiv;
            var inventoryModel=this.currentModel.toJSON();

            if(inventoryModel.project) {
                var ID = inventoryModel.project._id;
                this.selectProject(ID);
            }

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog  task-edit-dialog',
                width      : 1600,
                buttons    : {
                    save: {
                        text : '保存',
                        class: 'btn blue',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    },
                    delete: {
                        text : '删除',
                        class: 'btn',
                        click: self.deleteItem
                    }
                }
            });
            var $thisEl = this.$el;
            $thisEl.find('.attachments').append(
                new AttachView({
                    model      : this.currentModel,
                    contentType: 'ContractTask'
                }).render().el
            );

            notDiv = this.$el.find('#divForNote');
            notDiv.append(
                new NoteView({
                    model      : this.currentModel,
                    contentType: 'Tasks'
                }).render().el);

            //var productsE;
            // var $thisEl = this.$el;
            // var productsContainer;
            // var productsModel=this.currentModel.toJSON()
            // if (productsModel.products) {
            // productsE = productsModel.products;
            //  if (productsE) {
            //      productsContainer = $thisEl.find('#productList');
            //  productsContainer.append(_.template(productsEdit, {
            //     products        : productsE

            // }));

            //  }
            //  }
            var model;
            model = this.currentModel.toJSON();

            var productItemContainer;

            productItemContainer = this.$el.find('#productItemsHolder');

            /*productItemContainer.append(
                new ProductItemView({
                    editable  : true,
                    canBeSold : true,
                    service   : true,
                    quotations: true
                }).render({model: model}).el
            );*/
            productItemContainer.append(
                new ProductItemView({
                }).render({model: model}).el
            );

            this.renderAssignees(this.currentModel);

            populate.get('#projectDd', '/projects/getForDd', {}, 'name', this);
            populate.getWorkflow('#workflowsDd', '#workflowNamesDd', CONSTANTS.URLS.WORKFLOWS_FORDD, {id: 'Tasks'}, 'name', this);
            populate.get2name('#assignedToDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this);
            populate.get2name('#pmrDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this);
            populate.get2name('#supplier', CONSTANTS.URLS.SUPPLIER, {}, this);
            populate.getPriority('#priorityDd', this);
            dataService.getData('/marketSettings/getForDd', {}, function (marketSettings) {
                marketSettings = _.map(marketSettings.data, function (marketSetting) {
                    marketSetting.name = marketSetting.name;

                    return marketSetting;
                });
                self.responseObj['#alumSource'] = marketSettings;
            });

            this.delegateEvents(this.events);

            this.$el.find('#StartDate').datepicker({dateFormat: 'd M, yy', minDate: new Date()});
            this.$el.find('#signedDate').datepicker({dateFormat: 'yy-MM-dd', monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']});

            // for input type number
            this.$el.find('#logged').spinner({
                min: 0,
                max: 1000
            });
            this.$el.find('#estimated').spinner({
                min: 0,
                max: 1000
            });

            return this;
        }

    });
    return EditView;
});
