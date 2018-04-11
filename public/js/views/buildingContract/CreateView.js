define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/buildingContract/CreateTemplate.html',
    'text!templates/buildingContract/inventory.html',
    'text!templates/buildingContract/aluminum.html', 
    'models/BuildingContractModel',
    'common',
    'populate',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'dataService',
    'constants'
], function (Backbone, $, _, ParentView, CreateTemplate, inventorys, aluminums, BuildingContractModel, common, populate, AttachView, SelectView, dataService, CONSTANTS) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'BuildingContract',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'      : 'showDatePicker',
            'change #workflowNames': 'changeWorkflows',
            'click .addItem a'     : 'getItem',
            'click .addItem2 a'    : 'getItem2',
            'click .removeItem'    : 'deleteRow',
            'keyup td[data-name=quantity],td[data-name=price] input' : 'changedTotalPrice'
        },

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new BuildingContractModel();
            
            this.responseObj['#aroundType'] = [
                {
                    _id  : '前',
                    name : '前'
                },
                {
                    _id  : '后',
                    name : '后'
                }
            ];

            this.responseObj['#unitType'] = [
                {
                    _id  : '天',
                    name : '天'
                },
                {
                    _id  : '月',
                    name : '月'
                },
                {
                    _id  : '年',
                    name : '年'
                }
            ];

            this.render();
        },

        getItem:function(e){
            var target = $(e.target);
            var $parrent = target.closest('tbody');
            var templ = _.template(inventorys);
            var $trEll = $parrent.find('tr.inventoryItem');
            e.preventDefault();
            e.stopPropagation();
            if(!$trEll.length){
                $parrent.prepend(templ({}));
            }else{
                $($trEll[$trEll.length - 1]).after(templ({}));
            }
        },

        getItem2:function(e){
            var target = $(e.target);
            var $parrent = target.closest('tbody');
            var templ = _.template(aluminums);
            var $trEll = $parrent.find('tr.aluminumItem');
            e.preventDefault();
            e.stopPropagation();
            if(!$trEll.length){
                $parrent.prepend(templ({}));
            }else{
                $($trEll[$trEll.length - 1]).after(templ({}));
            }
        },

        deleteRow: function (e){
            var target = $(e.target);
            var tr = target.closest('tr');
            tr.remove();

        },

        changedTotalPrice: function (e) {
            var $targetEl = $(e.target);
            var $parent = $targetEl.closest('tr');
            var inputEl = $targetEl.closest('input');
            var quantity = $parent.find('#quantity').val() || 0;
            var price = $parent.find('#price').val() || 0;
            var totalPrice = quantity * price;
            $parent.find('#totalPrice').val(totalPrice);
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

        saveItem: function () {
            var self = this;
            var mid = 39;
            //var projectDd = $.trim(this.$el.find('#projectDd').val());
            var projectDd = this.$el.find('#building').attr('data-id');
            var customerDd = this.$el.find('#customerDd').attr('data-id');
            var contactName = $.trim(this.$el.find('#contactName').val());
            var customerPhone = $.trim(this.$el.find('#customerPhone').val());
            var orderDate = $.trim(this.$el.find('#orderDate').val());
            var projectManager = $.trim(this.$el.find('#projectManager').val());
            var managerPhone = $.trim(this.$el.find('#managerPhone').val());
            var shipAddress = $.trim(this.$el.find('#shipAddress').val());
            var deliveryDate1 = $.trim(this.$el.find('#deliveryDate1').val());
            var deliveryDate2 = $.trim(this.$el.find('#deliveryDate2').val());
            var clerk1 = $.trim(this.$el.find('#clerk1').val());
            var clerk2 = $.trim(this.$el.find('#clerk2').val());
            var clerk3 = $.trim(this.$el.find('#clerk3').val());
            var merchandiser1 = $.trim(this.$el.find('#merchandiser1').val());
            var merchandiser2 = $.trim(this.$el.find('#merchandiser2').val());
            var merchandiser3 = $.trim(this.$el.find('#merchandiser3').val());
            var inUndertaking = this.$el.find("[name='inUndertaking']:checked").attr('data-value');
            //var contractNum = $.trim(this.$el.find('#contractNum').val());
            var clerkRate = $.trim(this.$el.find('#clerkRate').val());
            var merchandiserRate = $.trim(this.$el.find('#merchandiserRate').val());
            var consignee = $.trim(this.$el.find('#consignee').val());
            var consigneePhone = $.trim(this.$el.find('#consigneePhone').val());
            var expectDate = $.trim(this.$el.find('#expectDate').val());
            var clerkRate1 = $.trim(this.$el.find('#clerkRate1').val());
            var clerkRate2 = $.trim(this.$el.find('#clerkRate2').val());
            var clerkRate3 = $.trim(this.$el.find('#clerkRate3').val());
            var merchandiserRate1 = $.trim(this.$el.find('#merchandiserRate1').val());
            var merchandiserRate2 = $.trim(this.$el.find('#merchandiserRate2').val());
            var merchandiserRate3 = $.trim(this.$el.find('#merchandiserRate3').val());
            var projectCost = $.trim(this.$el.find('#projectCost').val());
            var projectQuantity = $.trim(this.$el.find('#projectQuantity').val());
            var minArea = $.trim(this.$el.find('#minArea').val());
            var ybxzj = $.trim(this.$el.find('#ybxzj').val());
            var sqm = $.trim(this.$el.find('#sqm').val());
            var cjlhf = $.trim(this.$el.find('#cjlhf').val());
            var szjys = $.trim(this.$el.find('#szjys').val());
            var addProvision = $.trim(this.$el.find('#addProvision').val());
            var payRate1 = $.trim(this.$el.find('#payRate1').val());
            var payRate2 = $.trim(this.$el.find('#payRate2').val());
            var payRate3 = $.trim(this.$el.find('#payRate3').val());
            var payRate4 = $.trim(this.$el.find('#payRate4').val());
            var payRate5 = $.trim(this.$el.find('#payRate5').val());
            var payRate6 = $.trim(this.$el.find('#payRate6').val());
            var payRate7 = $.trim(this.$el.find('#payRate7').val());
            var earnest = $.trim(this.$el.find('#earnest').val());
            var areaSettle = $.trim(this.$el.find('#areaSettle').val());
            var amountSettle = $.trim(this.$el.find('#amountSettle').val());
            var aroundType = $.trim(this.$el.find('#aroundType').text());
            var time = $.trim(this.$el.find('#time').val());
            var unitType = $.trim(this.$el.find('#unitType').text());
            var warrantyDate = $.trim(this.$el.find('#warrantyDate').val());
            
            var selectedinventory = this.$el.find('.inventoryItem');
            var selectedLength = selectedinventory.length;
            var inventory=[];
            var targetEl;

            for (var i = 0; i < selectedLength; i++) {
                targetEl = $(selectedinventory[i]);
                //var product=targetEl.find('[data-name="product"] input').val();
                var product=$.trim(targetEl.find('#product').attr('data-id'));
                var quantity=targetEl.find('[data-name="quantity"] input').val();
                var price=targetEl.find('[data-name="price"] input').val();
                var unit=targetEl.find('[data-name="unit"] input').val();
                var totalPrice=targetEl.find('[data-name="totalPrice"] input').val();
                //var alumSource=targetEl.find('[data-name="alumSource"] input').val();
                var alumSource=$.trim(targetEl.find('#alumSource').text());
                var alumRange1=targetEl.find('#alumRange1').val();
                var alumRange2=targetEl.find('#alumRange1').val();
                var alumPrice=targetEl.find('[data-name="alumPrice"] input').val();
                var executePrice=targetEl.find('[data-name="executePrice"] input').val();

                inventory.push({
                    product     :  product,
                    quantity    :  quantity,
                    price       :  price,
                    unit        :  unit,
                    totalPrice  :  totalPrice,
                    alumSource  :  alumSource,
                    alumRange1  :  alumRange1,
                    alumRange2  :  alumRange2,
                    alumPrice   :  alumPrice,
                    executePrice:  executePrice
                });

            }

            var selectedaluminum = this.$el.find('.aluminumItem');
            var aluminumLength = selectedaluminum.length;
            var aluminum=[];
            var targetEl1;

            for (var i = 0; i < aluminumLength; i++) {
                targetEl1 = $(selectedaluminum[i]);
                var items=targetEl1.find('[data-name="items"] input').val();
                var price=targetEl1.find('[data-name="price"] input').val();
                var unit=targetEl1.find('[data-name="unit"] input').val();
                var notes=targetEl1.find('[data-name="notes"] input').val();

                aluminum.push({
                    items       :  items,
                    price       :  price,
                    unit        :  unit,
                    notes       :  notes
                });

            }         

            this.model.save(
                {
                    projectName  : projectDd,
                    customer     : customerDd,
                    contactName  : contactName,
                    customerPhone : customerPhone,
                    orderDate    : orderDate,
                    projectManager: projectManager,
                    managerPhone : managerPhone,
                    shipAddress  : shipAddress,
                    deliveryDate1: deliveryDate1,
                    deliveryDate2: deliveryDate2,
                    clerk1       : clerk1,
                    clerk2       : clerk2,
                    clerk3       : clerk3,
                    merchandiser1: merchandiser1,
                    merchandiser2: merchandiser2,
                    merchandiser3: merchandiser3,
                    inUndertaking: inUndertaking,
                    //contractNum  : contractNum,
                    clerkRate    : clerkRate,
                    clerkRate1   : clerkRate1,
                    clerkRate2   : clerkRate2,
                    clerkRate3   : clerkRate3,
                    merchandiserRate  : merchandiserRate,
                    merchandiserRate1 : merchandiserRate1,
                    merchandiserRate2 : merchandiserRate2,
                    merchandiserRate3 : merchandiserRate3,
                    consignee    : consignee,
                    consigneePhone : consigneePhone,
                    expectDate : expectDate,
                    projectCost  : projectCost,
                    projectQuantity   : projectQuantity,
                    minArea      : minArea,
                    addProvision : addProvision,
                    payRate1     : payRate1,
                    payRate2     : payRate2,
                    payRate3     : payRate3,
                    payRate4     : payRate4,
                    payRate5     : payRate5,
                    payRate6     : payRate6,
                    payRate7     : payRate7,
                    earnest      : earnest,
                    areaSettle   : areaSettle,
                    amountSettle : amountSettle,
                    aroundType   : aroundType,
                    time         : time,
                    unitType     : unitType,
                    warrantyDate : warrantyDate,
                    ybxzj        : ybxzj,
                    sqm          : sqm,
                    cjlhf        : cjlhf,
                    szjys        : szjys,
                    inventory    : inventory,
                    aluminum     : aluminum
                },
                {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function (model) {
                        /*var currentModel = model.changed;

                        self.attachView.sendToServer(null, currentModel);*/
                        Backbone.history.navigate('easyErp/buildingContract', {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            if($target.closest('a').attr('id') == 'alumSource'){
                $target.parents('td').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            }
            else if($target.closest('a').attr('id') == 'product'){
                $target.parents('td').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            }
            else if($target.closest('a').attr('id') == 'building'){
                $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
                this.selectBuilding($(e.target).attr('id'));
            }
            else{
                $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            }
        },

        selectBuilding: function (id) {

            if (id !== '') {
                dataService.getData( '/buildingContract/getCustomers', {building : id}, function (response, context) {

                    if (response) {
                        var customer = response.data;

                        context.$el.find('#customerDd').val(customer.name.first + customer.name.last);
                        context.$el.find('#customerDd').attr('data-id', customer._id);                     

                    }
                }, this);
            } else {
                this.$el.find('#customerDd').val('');
            }

        },

        render: function () {
            var formString = this.template();
            var self = this;
            var filterHash;
            var filter;

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                dialogClass  : 'edit-dialog',
                width        : 900,
                title        : 'Create BuildingContract',
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

            this.$el.find('#orderDate').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });

            this.$el.find('#expectDate').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });

            this.$el.find('#deliveryDate1').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });

            this.$el.find('#deliveryDate2').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });

            //populate.get('#customerDd', '/customers/getCustomers', {}, 'name.first', this, true);
           
            dataService.getData('/marketSettings/getForDd', {}, function (marketSettings) {
                marketSettings = _.map(marketSettings.data, function (marketSetting) {
                    marketSetting.name = marketSetting.name;

                    return marketSetting;
                });
                self.responseObj['#alumSource'] = marketSettings;
            });

            dataService.getData('/buildingContract/getBuildings', {}, function (buildings) {
                buildings = _.map(buildings.data, function (building) {
                    building.name = building.name;

                    return building;
                });
                self.responseObj['#building'] = buildings;
            });

            dataService.getData('/buildingContract/getSoldProducts', {}, function (products) {
                products = _.map(products.data, function (product) {
                    product.name = product.name;

                    return product;
                });
                self.responseObj['#product'] = products;
            });

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
