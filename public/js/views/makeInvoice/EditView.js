define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/makeInvoice/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'dataService',
    'moment',
    'text!templates/makeInvoice/taxList.html',
    'models/makeInvoiceModel',
    'text!templates/makeInvoice/taxSave.html',
    'text!templates/makeInvoice/taxCheck.html'
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
             dataService,
             moment,
             taxList,
             CurrentModel,
             taxSave,
             taxCheck
) {

    var EditView = ParentView.extend({
        contentType: 'makeInvoice',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'click .checkbox '                          : 'calculateTaxBefor',
            'keyup td[data-name=rate] input'            : 'calculateTaxBefor'
        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'saveItem', 'deleteItem','use','makeSell');

            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.MAKEINVOICE;
            this.type=(options.type) ? options.type : 'normal';

            this.render();
        },


        calculateTaxBefor:function () {

            var selectedTax = this.$el.find('.taxItem');
            for (var i = selectedTax.length - 1; i >= 0; i--)
            {
                var targetEl = $(selectedTax[i]);
                var gist = targetEl.find('#gist').val();
                var gistId = targetEl.find('#gist').data('id');
                if (!gistId ) {
                    var rate = targetEl.closest('tr').find('#rate').val();
                    var amount = targetEl.closest('tr').find('.amount');
                    var taxAmount;
                    taxAmount = gist * rate / 100;
                    amount.text(taxAmount);

                }
                if(i==0){
                    var select=this.$el.find('.taxItem');
                    for( var j=select.length-1;j>=0;j--){
                        var target=$(select[j]);
                        var gistId2 = target.find('.gist').data('id');
                        if(gistId2){
                            var sel=this.$el.find('.taxItem');
                            var gistAmount=target.find('.gist');
                            for (var k = sel.length - 1; k >= 0; k--) {
                                var tar = $(sel[k]);
                                var id = tar.find('.checkbox').val();

                                if (gistId2 == id)
                                {
                                    var rightGist;
                                    var gist1 = tar.find('.amount').text();
                                    var gist2=tar.find('#amount').val();
                                    if(gist1>0) {
                                        gistAmount.text(gist1);
                                        rightGist=gist1;
                                    } else{
                                        gistAmount.text(gist2);
                                        rightGist=gist2;
                                    }

                                    var rate1 = target.find('#rate').val();
                                    var amount1 = target.find('.amount');
                                    var taxAmount1;
                                    taxAmount1 = rightGist * rate1 / 100;
                                    amount1.text(taxAmount1);
                                    break
                                }
                            }
                        }
                    }
                }
            }


        } ,

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function (event) {
            var self = this;

            var mid;
            var data;
            event.preventDefault();
            mid = 39;

            var payer = $.trim(this.$el.find('#payer').attr('data-id'));
            var name = $.trim(this.$el.find('#name').val());
            var amount = $.trim(this.$el.find('#amount').val());
            var addValueTax = $.trim(this.$el.find('#addValueTax').val());
            var cost = $.trim(this.$el.find('#cost').val());
            var day = $.trim(this.$el.find('#day').val());
            var sell = $.trim(this.$el.find('#sell').val());
            var receive = $.trim(this.$el.find('#receive').val());
            var profit = $.trim(this.$el.find('#profit').val());
            var type = $.trim(this.$el.find("[name='type']:checked").attr('data-value'));
            var thisModel=this.currentModel.toJSON();
            var invoiceId=thisModel.invoiceInfo._id;



            dataService.patchData(CONSTANTS.URLS.MAKEINVOICE_UPDATE,{
                _id:invoiceId,datass:{
                    payer:payer,
                    name:name,
                    amount:amount,
                    addValueTax:addValueTax,
                    cost:cost,
                    day:day,
                    sell:sell,
                    receive:receive,
                    profit:profit,
                    type:type
                }
            },function (response) {
                var url = window.location.hash;

                Backbone.history.fragment = '';

                Backbone.history.navigate(url, {trigger: true});
            })
        },

        deleteItem: function (event) {
            var mid;
            var self = this;
            var answer;

            event.preventDefault();

            mid=39;

            answer = confirm('Really DELETE items ?!');
            var thisModel=this.currentModel.toJSON();
            var invoiceId=thisModel.invoiceInfo._id;

            if (answer === true) {
                dataService.patchData(CONSTANTS.URLS.MAKEINVOICE_UPDATE,{
                    _id:invoiceId,datass:{
                       state:'delete'
                    }
                },function (response) {
                    var url = window.location.hash;

                    Backbone.history.fragment = '';

                    Backbone.history.navigate(url, {trigger: true});
                })
            }
        },

        use:function (event) {
            var self = this;

            var mid;
            var data;
            event.preventDefault();
            mid = 39;
            var selectedTax = this.$el.find('.taxItem');
            var targetEl;
            var sumTax=0;
            var sumRate;
            var invoiceId;

            var thisModel=this.currentModel.toJSON();
            invoiceId=thisModel.invoiceInfo._id;
            for (var i = selectedTax.length - 1; i >= 0; i--) {
                targetEl = $(selectedTax[i]);
                var choice= targetEl.find(".checkbox").is(':checked');
                var taxSaveId=targetEl.find('.checkbox').data('id');
                if(choice){

                    var ID= targetEl.find(".checkbox").attr('value');
                    var name= targetEl.find('#name').val();
                    var rate=targetEl.find('#rate').val();
                    var gist=targetEl.find('.gist').text() || targetEl.find('#gist').val();
                    var amount1=targetEl.find('.amount').text();
                    var amount2=targetEl.find('#amount').val();
                    var amount;
                    if(amount1>0){
                        amount=amount1
                    } else{
                        amount=amount2;
                    }
                    sumTax=sumTax*1+amount*1;
                    data = {
                        taxSaveId      :taxSaveId,
                        invoice        :invoiceId,
                        tax            : ID,
                        name          : name,
                        rate          : rate,
                        gist          : gist,
                        amount        : amount
                    };

                    var model=new CurrentModel();
                    model.save(data, {
                     headers: {
                     mid: 56
                     },
                     wait   : true,
                     success: function () {
                     self.hideDialog();
                     },

                     error: function (model, xhr) {
                     self.errorNotification(xhr);
                     }
                     });

                }
                else if(taxSaveId){

                    data={
                        taxSaveId:taxSaveId,
                        del:1
                    };

                    var model=new CurrentModel();
                    model.save(data, {
                        headers: {
                            mid: 56
                        },
                        wait   : true,
                        success: function () {
                            self.hideDialog();
                        },

                        error: function (model, xhr) {
                            self.errorNotification(xhr);
                        }
                    });
                }
            }
            if(thisModel.invoiceInfo.invoice) {
                sumRate = sumTax / thisModel.invoiceInfo.invoice.realAmount;
                dataService.patchData(CONSTANTS.URLS.MAKEINVOICE_UPDATE, {
                    _id: invoiceId, datass: {invoiceTax: sumTax, rate: sumRate}
                }, function (response) {
                    var url = window.location.hash;

                    Backbone.history.fragment = '';

                    Backbone.history.navigate(url, {trigger: true});
                })
            } else{
                sumRate = sumTax / thisModel.invoiceInfo.sell;
                dataService.patchData(CONSTANTS.URLS.MAKEINVOICE_UPDATE, {
                    _id: invoiceId, datass: {sellTax : sumTax, rate: sumRate}
                }, function (response) {
                    var url = window.location.hash;

                    Backbone.history.fragment = '';

                    Backbone.history.navigate(url, {trigger: true});
                })
            }



        },

        makeSell: function (event) {
            var self = this;

            var mid;
            var data;
            event.preventDefault();
            mid = 39;

            var payer = $.trim(this.$el.find('#payer').attr('data-id'));
            var name = $.trim(this.$el.find('#invoiceName').val());
            var amount = $.trim(this.$el.find('#invoiceAmount').val());
            var addValueTax = $.trim(this.$el.find('#addValueTax').val());
            var cost = $.trim(this.$el.find('#cost').val());
            var day = $.trim(this.$el.find('#makeSellDay').val());
            var sell = $.trim(this.$el.find('#sell').val());
            var receive = $.trim(this.$el.find('#receive').val());
            var profit = $.trim(this.$el.find('#profit').val());
            var type = $.trim(this.$el.find("[name='type']:checked").attr('data-value'));
            var thisModel=this.currentModel.toJSON();
            var invoiceId=thisModel.invoiceInfo._id;
            var projectId=thisModel.invoiceInfo.project._id;

            dataService.patchData(CONSTANTS.URLS.MAKEINVOICE_UPDATE,{
                _id:invoiceId,
                datass: {
                    payer: payer,
                    name: name,
                    amount: amount,
                    addValueTax: addValueTax,
                    cost: cost,
                    day: day,
                    sell: sell,
                    receive: receive,
                    profit: profit,
                    type: type,
                    dataType: 'sell',
                    project: projectId
                },operation:'makeSell'
            },function (response) {
                var url = window.location.hash;

                Backbone.history.fragment = '';

                Backbone.history.navigate(url, {trigger: true});
            })
        },

        render: function () {
            var model=this.currentModel.toJSON();
            model.invoiceInfo.day=moment(model.invoiceInfo.day).format('YYYY-MM-DD');

            var formString = this.template({
                model:model
            });

            var forCheck=_.template(taxCheck)({
                model:model
            });

            var self = this;
            if(model.invoiceInfo.dataType=='manually'){
                this.$el = $(formString).dialog({
                    dialogClass: 'edit-dialog  task-edit-dialog',
                    width: 800,
                    buttons: {
                        save: {
                            text: '保存',
                            class: 'btn blue',
                            click: self.saveItem
                        },
                        cancel: {
                            text: '取消',
                            class: 'btn blue',
                            click: self.hideDialog
                        },
                        delete: {
                            text: '删除',
                            class: 'btn blue',
                            click: self.deleteItem
                        }
                    }
                });
            } else {
                if(this.type=='taxSave'){
                    this.$el = $(forCheck).dialog({
                        dialogClass: 'edit-dialog  task-edit-dialog',
                        width: 800,
                        buttons: {
                            cancel: {
                                text: '取消',
                                class: 'btn blue',
                                click: self.hideDialog
                            }
                        }
                    });
                } else {
                    if(model.invoiceInfo.dataType=='sell'){
                        this.$el = $(formString).dialog({
                            dialogClass: 'edit-dialog  task-edit-dialog',
                            width: 800,
                            buttons: {
                                save: {
                                    text: '保存',
                                    class: 'btn blue',
                                    click: self.saveItem
                                },
                                use: {
                                    text: '修税',
                                    class: 'btn blue',
                                    click: self.use
                                },
                                cancel: {
                                    text: '取消',
                                    class: 'btn blue',
                                    click: self.hideDialog
                                }
                            }
                        });
                    }else {
                        if(model.invoiceInfo.makeSell=='no') {
                            this.$el = $(formString).dialog({
                                dialogClass: 'edit-dialog  task-edit-dialog',
                                width: 800,
                                buttons: {
                                    use: {
                                        text: '修税',
                                        class: 'btn blue',
                                        click: self.use
                                    },

                                    makeSell: {
                                        text: '转销售',
                                        class: 'btn blue',
                                        click: self.makeSell
                                    },

                                    cancel: {
                                        text: '取消',
                                        class: 'btn blue',
                                        click: self.hideDialog
                                    }
                                }
                            });
                        } else {
                            this.$el = $(formString).dialog({
                                dialogClass: 'edit-dialog  task-edit-dialog',
                                width: 800,
                                buttons: {
                                    use: {
                                        text: '修税',
                                        class: 'btn blue',
                                        click: self.use
                                    },

                                    cancel: {
                                        text: '取消',
                                        class: 'btn blue',
                                        click: self.hideDialog
                                    }
                                }
                            });
                        }
                    }
                }

                var tax;
                var list;
                if (model.invoiceTax) {
                    list = taxSave;
                } else {
                    list = taxList;
                }
                dataService.getData(CONSTANTS.URLS.TAXCATEGORIES_GETFORDD, {}, function (response) {
                    tax = self.$el.find('#taxList');
                    tax.prepend(_.template(list, {
                        tax: response,
                        invoice: self.currentModel.toJSON()
                    }));
                    self.calculateTaxBefor();
                });
            }


            this.$el.find('#day').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : 0
            });
            this.$el.find('#makeSellDay').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : 0
            }).datepicker('setDate', new Date());
            this.delegateEvents(this.events);


            return this;
        }

    });
    return EditView;
});
