define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/buildingContract/EditTemplate.html',
    'text!templates/buildingContract/inventory.html',
    'text!templates/buildingContract/aluminum.html',
    'text!templates/buildingContract/inventoryEdit.html',
    'text!templates/buildingContract/aluminumEdit.html', 
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Editor/AttachView',
    'common',
    'populate',
    'custom',
    'dataService',
    'constants'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             inventorys,
             aluminums,
             inventorysEdit, 
             aluminumsEdit,
             selectView,
             NoteView,
             AttachView,
             common,
             populate,
             custom,
             dataService,
             CONSTANTS) {

    var EditView = ParentView.extend({
        contentType: 'BuildingContract',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter',
            'click .addItem a'     : 'getItem',
            'click .addItem2 a'    : 'getItem2',
            'click .removeItem'    : 'deleteRow',
            'keyup td[data-name=quantity],td[data-name=price] input' : 'changedTotalPrice'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.BUILDINGCONTRACT;

            self.eventChannel = options.eventChannel;

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

            this.render(options);
        },

        chooseOption: function (e) {
            var target = $(e.target);
            //var endElem = target.parents('dd').find('.current-selected');

            //endElem.text(target.text()).attr('data-id', target.attr('id'));
            //endElem.attr('data-shortdesc', target.data('level'));
            if(target.closest('a').attr('id') == 'alumSource'){
                target.parents('td').find('.current-selected').text(target.text()).attr('data-id', target.attr('id'));
            }
            else if(target.closest('a').attr('id') == 'product'){
                target.parents('td').find('.current-selected').text(target.text()).attr('data-id', target.attr('id'));
            }
            else{
                target.parents('dd').find('.current-selected').text(target.text()).attr('data-id', target.attr('id'));
            }
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

        saveItem: function (event) {
            var mid = 39;
            var self = this;
            var model;
            var $currentEl = this.$el;
            var projectDd = $.trim(this.$el.find('#projectDd').val());
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
            var contractNum = $.trim(this.$el.find('#contractNum').val());
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
            var minArea = $.trim(this.$el.find('#minArea').val());

            var selectedinventory = this.$el.find('.inventoryItem');
            var selectedLength = selectedinventory.length;
            var targetEl;
            var inventory = [];

            for (var i = 0; i < selectedLength ; i++) {
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
            var targetEl1;
            var aluminum = [];

            for (var i = 0; i < aluminumLength ; i++) {
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

            var data = {
                //projectName  : projectDd,
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
                contractNum  : contractNum,
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
                inventory    : inventory,
                aluminum     : aluminum,
                minArea      : minArea
            };

            event.preventDefault();

            //this.currentModel.set(data);

            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                patch  : true,

                success: function () {
                    self.hideDialog();
                    Backbone.history.navigate('easyErp/buildingContract', {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },

        render: function (options) {
            var formString = this.template({
                model: this.currentModel.toJSON()
            });
            var self = this;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 900,
                title      : 'edit buildingContract',
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
                    }
                }
            });

            this.renderAssignees(this.currentModel);

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

            var inventoryE;
            var inventoryContainer;
            var inventoryModel=this.currentModel.toJSON();

            if (inventoryModel.inventory) {
                inventoryE = inventoryModel.inventory;
                if (inventoryE) {
                    inventoryContainer = this.$el.find('#inventoryList');
                    inventoryContainer.append(_.template(inventorysEdit, {
                        inventory    : inventoryE

                    }));

                }
            } 

            var aluminumE;
            var aluminumContainer;

            if (inventoryModel.aluminum) {
                aluminumE = inventoryModel.aluminum;

                if (aluminumE) {
                    aluminumContainer = this.$el.find('#aluminumList');
                    aluminumContainer.append(_.template(aluminumsEdit, {
                        aluminum    : aluminumE

                    }));

                }
            } 

            dataService.getData('/marketSettings/getForDd', {}, function (marketSettings) {
                marketSettings = _.map(marketSettings.data, function (marketSetting) {
                    marketSetting.name = marketSetting.name;

                    return marketSetting;
                });

                self.responseObj['#alumSource'] = marketSettings;
            });

            dataService.getData('/buildingContract/getSoldProducts', {projectName : this.currentModel.toJSON().projectName._id}, function (products) {
                products = _.map(products.data, function (product) {
                    product.name = product.name;

                    return product;
                });
                self.responseObj['#product'] = products;
            });

            notDiv = this.$el.find('.attach-container');
            notDiv.append(
                new AttachView({
                    model      : this.currentModel,
                    contentType: self.contentType
                }).render().el
            );
            
            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
