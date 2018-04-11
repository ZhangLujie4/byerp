define([
    'jQuery',
    'Underscore',
    'Backbone',
    'text!templates/ExpensesInvoice/InvoiceProductItems.html',
    'text!templates/ExpensesInvoice/InvoiceProductInputContent.html',
    'text!templates/ExpensesInvoice/EditInvoiceProductInputContent.html',
    'text!templates/ExpensesInvoice/TotalAmount.html',
    'collections/Products/products',
    'populate',
    'helpers'
], function ($, _, Backbone, productItemTemplate, ProductInputContent, ProductItemsEditList, totalAmount, ProductCollection, populate, helpers) {
    'use strict';

    var ProductItemTemplate = Backbone.View.extend({
        el: '#invoiceItemsHolder',

        events: {
            'click .addProductItem a'                          : 'getProducts',
            'click .current-selected'                          : 'showProductsSelect',
            'click .newSelectList li:not(.miniStylePagination)': 'chooseOption',
            'keyup td[data-name=price],td[data-name=quantity] ,td[data-name=taxes] input'     : 'recalculateTaxes'
        },

        initialize: function (options) {
            var products;

            this.responseObj = {};
            this.taxesRate = 0;
            this.discountVisible = options.discountVisible;

            this.recalculateTaxes = _.debounce(this.recalculateTaxes, 500);

            if (options) {
                this.visible = !!options.balanceVisible;
                this.isPaid = !!options.isPaid;
                this.notAddItem = !!options.notAddItem;
                this.paid = options.paid;
            }

            this.forSales = options.forSales;



            products = new ProductCollection(options);
            products.bind('reset', function () {
                this.products = products;
                this.filterProductsForDD();
            }, this);
        },

        template: _.template(productItemTemplate),

        getProducts: function (e) {
            var target = $(e.target);
            var parrent = target.closest('tbody');
            var parrentRow = parrent.find('.productItem').last();
            var rowId = parrentRow.attr('data-id');
            var trEll = parrent.find('tr.productItem');
            console.log(1)

            e.preventDefault();
            e.stopPropagation();
            if (!trEll.length) {
                return parrent.prepend(_.template(ProductInputContent));
            } else {
                $(trEll[trEll.length - 1]).after(_.template(ProductInputContent));
            }


            return false;
        },

        filterProductsForDD: function () {
            var id = '.productsDd';
            var products = this.products.toJSON();

            this.responseObj[id] = [];
            this.responseObj[id] = this.responseObj[id].concat(_.map(products, function (item) {
                return {_id: item._id, name: item.name, level: item.projectShortDesc || ''};
            }));
        },

        showProductsSelect: function (e, prev, next) {
            populate.showProductsSelect(e, prev, next, this);

            return false;
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var parrent = target.parents('td');
            var trEl = target.parents('tr');
            var parrents = trEl.find('td');
            var _id = target.attr('id');
            var model = this.products.get(_id);
            var selectedProduct = model.toJSON();
            var taxes;
            var price;
            var amount;

            trEl.attr('data-id', model.id);

            parrent.find('.current-selected').text(target.text()).attr('data-id', _id);

            $(parrents[1]).attr('class', 'editable').find('span').text(selectedProduct.info.description || '');
            $(parrents[2]).attr('class', 'editable').find('span').text(1);

            price = selectedProduct.info.salePrice;
            $(parrents[3]).attr('class', 'editable').find('span').text(price);

            taxes = parseFloat(selectedProduct.info.salePrice) * this.taxesRate;
            amount = price + taxes;
            taxes = taxes.toFixed(2);

            $(parrents[4]).text(taxes);
            $(parrents[5]).text(amount.toFixed(2));

            $('.newSelectList').hide();

            this.calculateTotal();
        },

        recalculateTaxes: function (parent) {
            var quantity;
            var cost;
            var amount;
            var taxes;
            var taxesAmount;
            var $parent = $(parent.target).closest('tr');

            quantity = $parent.find('[data-name="quantity"] input').val() || 0;
            quantity = parseFloat(quantity);
            cost = $parent.find('[data-name="price"] input').val() || 0;
            cost = parseFloat(cost);
            taxes = $parent.find('[data-name="taxes"] input').val() || 0;
            taxes = parseFloat(taxes);
            amount = (quantity * cost);
            taxesAmount=amount*taxes;
            amount = amount.toFixed(2);
            taxesAmount = taxesAmount.toFixed(2);
            $parent.find('.amount').text(amount);
            $parent.find('.taxesAmount').text(taxesAmount);
            this.calculateTotal(amount,taxesAmount);
        },

        calculateTotal: function (amount,taxesAmount) {
            var $thisEl = this.$el;
            var totalAmountBig = $thisEl.find('#totalAmountBig');
            var totalAmountSmall = $thisEl.find('#totalAmountSmall');
            var resultForCalculate = $thisEl.find('tr.productItem');
            console.log(369)
            var total = 0;

            var totalEls = resultForCalculate.length;
            var $currentEl;
            var taxesAmount;
            var totalAmount;
            var i;
            var Big;

            if (totalEls) {
                for (i = totalEls - 1; i >= 0; i--) {
                    $currentEl = $(resultForCalculate[i]);
                    taxesAmount = $currentEl.find('.taxesAmount').text();
                    totalAmount = $currentEl.find('.amount').text();
                    total+= taxesAmount*1+totalAmount*1;

                }
            }
            total = total.toFixed(2);
            Big=this.changeNumMoneyToChinese(total);
            totalAmountBig.text(Big);
            totalAmountSmall.text(total);
        },

        changeNumMoneyToChinese:function (money) {
        var cnNums = new Array("零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"); //汉字的数字
        var cnIntRadice = new Array("", "拾", "佰", "仟"); //基本单位
        var cnIntUnits = new Array("", "万", "亿", "兆"); //对应整数部分扩展单位
        var cnDecUnits = new Array("角", "分", "毫", "厘"); //对应小数部分单位
        var cnInteger = "整"; //整数金额时后面跟的字符
        var cnIntLast = "元"; //整型完以后的单位
        var maxNum = 999999999999999.9999; //最大处理的数字
        var IntegerNum; //金额整数部分
        var DecimalNum; //金额小数部分
        var ChineseStr = ""; //输出的中文金额字符串
        var parts; //分离金额后用的数组，预定义
        if (money == "") {
            return "";
        }
        money = parseFloat(money);
        if (money >= maxNum) {
            alert('超出最大处理数字');
            return "";
        }
        if (money == 0) {
            ChineseStr = cnNums[0] + cnIntLast + cnInteger;
            return ChineseStr;
        }
        money = money.toString(); //转换为字符串
        if (money.indexOf(".") == -1) {
            IntegerNum = money;
            DecimalNum = '';
        } else {
            parts = money.split(".");
            IntegerNum = parts[0];
            DecimalNum = parts[1].substr(0, 4);
        }
        if (parseInt(IntegerNum, 10) > 0) { //获取整型部分转换
            var zeroCount = 0;
            var IntLen = IntegerNum.length;
            for (var i = 0; i < IntLen; i++) {
                var n = IntegerNum.substr(i, 1);
                var p = IntLen - i - 1;
                var q = p / 4;
                var m = p % 4;
                if (n == "0") {
                    zeroCount++;
                } else {
                    if (zeroCount > 0) {
                        ChineseStr += cnNums[0];
                    }
                    zeroCount = 0; //归零
                    ChineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
                }
                if (m == 0 && zeroCount < 4) {
                    ChineseStr += cnIntUnits[q];
                }
            }
            ChineseStr += cnIntLast;
            //整型部分处理完毕
        }
        if (DecimalNum != '') { //小数部分
            var decLen = DecimalNum.length;
            for (var i = 0; i < decLen; i++) {
                var n = DecimalNum.substr(i, 1);
                if (n != '0') {
                    ChineseStr += cnNums[Number(n)] + cnDecUnits[i];
                }
            }
        }
        if (ChineseStr == '') {
            ChineseStr += cnNums[0] + cnIntLast + cnInteger;
        } else if (DecimalNum == '') {
            ChineseStr += cnInteger;
        }
        return ChineseStr;

    },

        nextSelect: function (e) {
            this.showProductsSelect(e, false, true);
        },

        prevSelect: function (e) {
            this.showProductsSelect(e, true, false);
        },

        render: function (options) {
            var self = this;
            var productsContainer;
            var totalAmountContainer;
            var thisEl = this.$el;
            var products;
            console.log(options)
            console.log(1111)
            if (options && options.model) {
                products = options.model.products;

                thisEl.html(_.template(productItemTemplate, {
                    model           : options.model,
                    forSales        : self.forSales,
                    isPaid          : self.isPaid,
                    notAddItem      : this.notAddItem,
                    currencySplitter: helpers.currencySplitter,
                    currencyClass   : helpers.currencyClass
                }));

                if (products) {
                    productsContainer = thisEl.find('#productList');
                    productsContainer.prepend(_.template(ProductItemsEditList, {
                        products        : products,
                        forSales        : self.forSales,
                        isPaid          : self.isPaid,
                        notAddItem      : this.notAddItem,
                        currencySplitter: helpers.currencySplitter,
                        currencyClass   : helpers.currencyClass
                    }));

                    totalAmountContainer = thisEl.find('#totalAmountContainer');

                    totalAmountContainer.append(_.template(totalAmount, {
                        model           : options.model,
                        balanceVisible  : this.visible,
                        discountVisible : this.discountVisible,
                        currencySplitter: helpers.currencySplitter,
                        currencyClass   : helpers.currencyClass
                    }));
                }
            } else {
                this.$el.html(this.template({
                    forSales  : self.forSales,
                    isPaid    : self.isPaid,
                    notAddItem: this.notAddItem
                }));
                totalAmountContainer = thisEl.find('#totalAmountContainer');
                totalAmountContainer.append(_.template(totalAmount, {
                    model           : null,
                    balanceVisible  : this.visible,
                    discountVisible : this.discountVisible,
                    currencySplitter: helpers.currencySplitter,
                    currencyClass   : helpers.currencyClass
                }));
            }

            return this;
        }
    });

    return ProductItemTemplate;
});
