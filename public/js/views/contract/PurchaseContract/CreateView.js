define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/contract/PurchaseContract/CreateTemplate.html',
    'models/PurchaseContractModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants',
    'text!templates/contract/PurchaseContract/product/products.html',
    'views/contract/PurchaseContract/ProductItems',
    'helpers/keyValidator',
    'helpers',
    'dataService'

], function (Backbone, $, _, ParentView, CreateTemplate, TaskModel, common, populate, AttachView, SelectView, CONSTANTS,Products,ProductItemView, keyValidator,
             helpers,dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'PurchaseContract',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'                       : 'showDatePicker',
            'change #workflowNames'                 : 'changeWorkflows',
            'click .addProductItem a'               : 'getItem',
            'click .removeJob'                      : 'deleteRow',
            'click .addCarriage a'                  : 'addCarriage'

        },

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new TaskModel();
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

            /*productItemContainer.append(
                new ProductItemView({canBeSold: false, quotations: true}).render().el)*/
            productItemContainer.append(
                new ProductItemView().render().el)


        },

        addAttach: function () {
            var $inputFile = this.$el.find('.input-file');
            var $attachContainer = this.$el.find('.attachContainer');
            var $inputAttach = this.$el.find('.inputAttach:last');
            var s = $inputAttach.val().split('\\')[$inputAttach.val().split('\\').length - 1];

            $attachContainer.append('<li class="attachFile">' +
                '<a href="javascript:;">' + s + '</a>' +
                '<a href="javascript:;" class="deleteAttach">Delete</a></li>'
            );

            $attachContainer.find('.attachFile:last').append($inputFile.find('.inputAttach').attr('hidden', 'hidden'));
            $inputFile.append('<input type="file" value="Choose File" class="inputAttach" name="attachfile">');
        },

        deleteAttach: function (e) {
            $(e.target).closest('.attachFile').remove();
        },

        fileSizeIsAcceptable: function (file) {
            if (!file) {
                return false;
            }
            return file.size < App.File.MAXSIZE;
        },

        getWorkflowValue: function (value) {
            var workflows = [];
            var i;

            for (i = 0; i < value.length; i++) {
                workflows.push({name: value[i].name, status: value[i].status, _id: value[i]._id});
            }

            return workflows;
        },

        showDatePicker: function () {
            var $createDatePicker = $('.createFormDatepicker');

            if ($createDatePicker.find('.arrow').length === 0) {
                $createDatePicker.append('<div class="arrow"></div>');
            }
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

        saveItem: function () {
            var self = this;
            var mid = 39;

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
                    product           : productId,
                    quantity          : quantity,
                    unitPrice         : unitPrice,
                    subTotal          : subTotal,
                    qty1              : qty1,
                    qty2              : qty2,
                    qty3              : qty3,
                    qty4              : qty4,
                    qty5              : qty5,
                    price1            : price1,
                    price2            : price2,
                    price3            : price3,
                    price4            : price4,
                    price5            : price5,
                    sourceAl          : sourceAl
                });
            }
            var productsTotal=helpers.spaceReplacer($.trim(thisEl.find('#totalAmount').text()));
            productsTotal = parseFloat(productsTotal) * 100;
            var project = this.$el.find('#projectDd').data('id');
            //var building=this.$el.find('#building').data('id');

            var description = $.trim(this.$el.find('#descriptions').val());
            var taskAmount = $.trim(this.$el.find('#taskAmount').val());
            var supplier = this.$el.find('#supplier').data('id') ;
            var quality = $.trim(this.$el.find('#quality').val());
            var violation = $.trim(this.$el.find('#violation').val());
            var note = $.trim(this.$el.find('#note').val());
            var payTerm = $.trim(this.$el.find('#payTerm').val());
            var payProp = $.trim(this.$el.find('#payProp').val());
            var signedDate = $.trim(this.$el.find('#signedDate').val());
            var proDate = $.trim(this.$el.find('#proDate').val());
            var proProduct = $.trim(this.$el.find('#proProduct').val());
            var workflow = this.$el.find('#workflowsDd').data('id');
            var sealType = this.$el.find('#sealType').data('id');



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

            var preAmount = $.trim(this.$el.find('#preAmount').val());
            var respons = $.trim(this.$el.find('#respons').val());
            var pmrName=$.trim(this.$el.find('#pmrDd').text());
            if(!taskAmount){
                return App.render({
                    type   : 'error',
                    message: '合同金额未填写!'
                })
            }
            if(!signedDate){
                return App.render({
                    type   : 'error',
                    message: '合同签定日期未填写!'
                })
            }
            if(!supplier){
                return App.render({
                    type   : 'error',
                    message: '供货商未填写!'
                })
            }
            /*if((!project && !building)||(project && building)){
                return App.render({
                    type   : 'error',
                    message: '请选择建材合同或者幕墙合同!'
                })
            }*/
            if(!project ){
                return App.render({
                    type   : 'error',
                    message: '请选择建材合同!'
                })
            }

            this.model.save(
                {
                    pmrName           : pmrName,
                    payProp           : payProp,
                    supplier          : supplier,
                    sealType          : sealType,
                    payTerm           : payTerm,
                    preAmount         : preAmount,
                    preAmountType     : preAmountTypeModel,
                    paymentType       : paymentTypeModel,
                    payType           : payType,
                    carriage          : carriageModel,
                    quota             : quotaModel,
                    proDate           : proDate,
                    respons           : respons,
                    violation         : violation,
                    quality           : quality,
                    products          : products,
                    productsTotal     : productsTotal,
                    workflow          : workflow,
                    project           : project ,
                    description       : description,
                    //building:building ,
                    taskAmount        : taskAmount,
                    note              : note,
                    signedDate        : signedDate,
                    proProduct        : proProduct
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        var currentModel = model.changed;

                        self.attachView.sendToServer(null, currentModel);
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
        },

        chooseOption: function (e) {
            var holder = $(e.target).parents('._modalSelect').find('.current-selected');
            holder.text($(e.target).text()).attr('data-id', $(e.target).attr('id'));
            if (holder.attr('id') === 'projectDd') {
                this.selectProject($(e.target).attr('id'));
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
            var afterPid = (window.location.hash).split('pId=')[1];
            var forKanban = (window.location.hash).split('kanban/')[1];
            var projectID = afterPid ? afterPid.split('/')[0] : forKanban;
            var formString = this.template();
            var self = this;
            var notDiv;
            var filterHash;
            var filter;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog task-edit-dialog',
                width        : 1600,
                title        : 'Create Task',
                buttons      : {
                    save: {
                        text : '创建',
                        class: 'btn blue',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }
                }
            });

            notDiv = this.$el.find('.attach-container');

            this.attachView = new AttachView({
                model      : new TaskModel(),
                contentType: self.contentType,
                isCreate   : true
            });

            if (!projectID) {
                filterHash = window.location.hash.split('filter=');
                filter = filterHash && filterHash.length > 1 ? JSON.parse(decodeURIComponent(filterHash[1])) : null;

                if (filter && filter.project) {
                    projectID = filter.project.value[0];
                }
            }

            notDiv.append(this.attachView.render().el);

            if (projectID) {
                populate.get('#projectDd', '/projects/getForDd', {}, 'name', this, false, false, projectID);
            } else {
                populate.get('#projectDd', '/projects/getForDd', {}, 'name', this, false, false);
            }
            this.createProductView();
            populate.getWorkflow('#workflowsDd', '#workflowNamesDd', CONSTANTS.URLS.WORKFLOWS_FORDD, {id: 'Tasks'}, 'name', this, true);
            populate.get2name('#assignedToDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, true);
            populate.get2name('#supplier', CONSTANTS.URLS.SUPPLIER, {'salesPurchases.isSupplier':true}, this, false, false);
            populate.get2name('#pmrDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {}, this, false, false);
            populate.getPriority('#priorityDd', this, true);
            populate.get('#projectDd', '/projects/getForDd', {}, 'name', this);
            dataService.getData('/marketSettings/getForDd', {}, function (marketSettings) {
                marketSettings = _.map(marketSettings.data, function (marketSetting) {
                    marketSetting.name = marketSetting.name;

                    return marketSetting;
                });
                self.responseObj['#alumSource'] = marketSettings;
            });
            //populate.get('#building', '/building/getBuildings', {}, 'name', this);

            this.$el.find('#StartDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],

            });
            this.$el.find('#signedDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
            }).datepicker('setDate', new Date());

            this.$el.find('#logged').spinner({
                min: 0,
                max: 9999
            });
            this.$el.find('#estimated').spinner({
                min: 0,
                max: 9999
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
