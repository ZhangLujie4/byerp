define([
        'Backbone',
        'jQuery',
        'Underscore',
        'text!templates/oemOutNote/form/FormTemplate.html',
        'text!templates/oemOutNote/form/ItemTemplate.html',
        'text!templates/oemOutNote/form/TotalTemplate.html',
        'text!templates/oemOutNote/form/InfoTemplate.html',
        'collections/oemOutNote/filterCollection',
        'models/oemOutNoteModel',
        'constants',
        'async',
        'moment',
        'dataService'
    ],
    function (Backbone, 
              $, 
              _, 
              FormTemplate,
              ItemTemplate,
              TotalTemplate,
              InfoTemplate,
              oemOutNoteCollection, 
              oemOutNoteModel, 
              CONSTANTS,
              async,
              moment,
              dataService) {
        'use strict';

        var FormView = Backbone.View.extend({
            el         : '#content-holder',
            responseObj: {},

            initialize: function (options) {

                var eventChannel = {};

                _.extend(eventChannel, Backbone.Events);
                this.eventChannel = eventChannel;
                this.formModel = options.model;
                this.formModel.urlRoot = '/oemOutNote/';
                this.id = this.formModel.toJSON()._id;
                this.render();
            },

            copy: function(){
                var div_print=document.getElementById("shipping-list");
                var newstr = div_print.innerHTML; 
                var oldstr = document.body.innerHTML; 
                document.body.innerHTML = newstr; 
                window.print(); 
                document.body.innerHTML = oldstr; 
                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true});
                return false; 
            },

            generate: function(){
                var self = this;
                App.startPreload();
                var formModel = this.formModel.toJSON().data;
                var status = formModel[0]? formModel[0].isReturn : false;
                dataService.postData('/oemOutNote/'+ this.id, {status: status}, function () {
                    App.stopPreload();

                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true, replace: true});
                });
            },

            renderTotal: function () {
                var formModel = this.formModel.toJSON().data;
                var numTotal = 0;
                var areaTotal = 0;
                var subTotal = 0;
                var tmTotal = 0;
                var sum = 0;
                for(var i=0; i<formModel.length; i++){
                    var num = 0;
                    var area = 0;
                    var amount = 0;
                    var totalAmount = 0;
                    var tmLength = 0;
                    var tmPrice = 0;
                    var totalArray = [];
                    for(var j=0; j<formModel[i].root.length; j++){
                        var flag = false;
                        for(var n=0; n<totalArray.length; n++){
                            if(totalArray[n].productName == formModel[i].root[j].productName){
                                totalArray[n].num += formModel[i].root[j].orderRows.quantity;
                                totalArray[n].area += formModel[i].root[j].orderRows.unit* formModel[i].root[j].orderRows.quantity;
                                totalArray[n].amount += formModel[i].root[j].orderRows.unit*formModel[i].root[j].orderRows.unitPrice*formModel[i].root[j].orderRows.quantity;
                                totalArray[n].tmLength += formModel[i].root[j].orderRows.quantity* formModel[i].root[j].orderRows.bhm/1000;
                                totalArray[n].tmPrice += formModel[i].root[j].orderRows.quantity* formModel[i].root[j].orderRows.fjldj* formModel[i].root[j].orderRows.bhm/1000;
                                flag = true;
                            }
                        }
                        if(!flag){
                             var item = {
                                productName: formModel[i].root[j].productName,
                                num: formModel[i].root[j].orderRows.quantity,
                                area: formModel[i].root[j].orderRows.unit* formModel[i].root[j].orderRows.quantity,
                                amount: formModel[i].root[j].orderRows.unit*formModel[i].root[j].orderRows.unitPrice*formModel[i].root[j].orderRows.quantity,
                                tmLength: formModel[i].root[j].orderRows.quantity* formModel[i].root[j].orderRows.bhm/1000,
                                tmPrice: formModel[i].root[j].orderRows.quantity* formModel[i].root[j].orderRows.fjldj* formModel[i].root[j].orderRows.bhm/1000,
                                unitprice: formModel[i].root[j].orderRows.unitPrice,
                                tmUnitPrice: formModel[i].root[j].orderRows.fjldj,
                             }
                             totalArray.push(item);
                        }
                        num = num + formModel[i].root[j].orderRows.quantity;
                        area = area + formModel[i].root[j].orderRows.unit* formModel[i].root[j].orderRows.quantity;
                        amount = amount + formModel[i].root[j].orderRows.unit*formModel[i].root[j].orderRows.unitPrice*formModel[i].root[j].orderRows.quantity;
                        tmLength = tmLength + formModel[i].root[j].orderRows.quantity* formModel[i].root[j].orderRows.bhm/1000;
                        tmPrice = tmPrice + formModel[i].root[j].orderRows.quantity* formModel[i].root[j].orderRows.fjldj* formModel[i].root[j].orderRows.bhm/1000
                    }
                    formModel[i].num = num;
                    formModel[i].area = area;
                    formModel[i].amount = amount;
                    formModel[i].tmLength = tmLength;
                    formModel[i].totalAmount = amount;
                    formModel[i].totalArray = totalArray;
                    if(tmPrice){
                        formModel[i].totalAmount = formModel[i].totalAmount + tmPrice;
                    }
                    numTotal = numTotal + num;
                    areaTotal = areaTotal + area;
                    subTotal = subTotal + amount;
                    tmTotal = tmTotal + tmLength;
                    sum = sum + formModel[i].totalAmount;
                }
                this.$el.find('#item-list').append(_.template(TotalTemplate, {
                    model: formModel,
                    numTotal: numTotal,
                    areaTotal: areaTotal,
                    subTotal: subTotal,
                    tmTotal: tmTotal,
                    sum: sum
                }))
            },

            render: function () {

                var formModel = this.formModel.toJSON().data;
                this.$el.html(_.template(FormTemplate, {
                }));
                this.$el.find('#item-list').html('');
                for(var i=0; i<formModel.length; i++){
                    this.$el.find('#item-list').append(_.template(ItemTemplate, {
                        model: formModel[i],
                        moment: moment
                    }))
                }
                
                this.renderTotal();
                this.$el.find('#item-list').append(_.template(InfoTemplate, {
                    model: formModel[0] || {}
                }))

                $('#top-bar-saveBtn').hide();
                $('#top-bar-editBtn').hide();
                $('#top-bar-deleteBtn').hide();
                $('.dateFilter').hide();
                if(formModel[0] && formModel[0].status && formModel[0].status == "Done"){
                    $('#top-bar-generateBtn').hide();
                }
                return this;
            },

        });
        return FormView;
    });
