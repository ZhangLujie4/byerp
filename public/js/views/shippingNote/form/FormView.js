define([
        'Backbone',
        'jQuery',
        'Underscore',
        'text!templates/shippingNote/form/FormTemplate.html',
        'text!templates/shippingNote/form/ItemTemplate.html',
        'text!templates/shippingNote/form/TotalTemplate.html',
        'text!templates/shippingNote/form/InfoTemplate.html',
        'collections/shippingNote/filterCollection',
        'models/shippingNoteModel',
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
              shippingNoteCollection, 
              shippingNoteModel, 
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
                this.formModel.urlRoot = '/shippingNote/';
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
                var status = formModel[0]? formModel[0].isReturn: false;
                console.log(status);
                dataService.postData('/shippingNote/'+ this.id, {status: status}, function () {
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
                var cjhfTotal = 0;
                var kcTotal = 0;
                var sum = 0;
                for(var i=0; i<formModel.length; i++){
                    var num = 0;
                    var area = 0;
                    var amount = 0;
                    var totalAmount = 0;
                    var kcLength = 0;
                    var cjhfLength = 0;
                    var totalArray = [];
                    for(var j=0; j<formModel[i].orderRows.length; j++){
                        var flag = false;
                        for(var n=0; n<totalArray.length; n++){
                            if(totalArray[n].boardType == formModel[i].orderRows[j].aluOrder.boardType && totalArray[n].thickness == formModel[i].orderRows[j].thickness){
                                totalArray[n].num += formModel[i].orderRows[j].num;
                                totalArray[n].area += formModel[i].orderRows[j].aluOrder.dkjjmj*formModel[i].orderRows[j].num;
                                totalArray[n].amount += formModel[i].orderRows[j].aluOrder.dj* formModel[i].orderRows[j].aluOrder.dkjjmj*formModel[i].orderRows[j].num;
                                totalArray[n].kcLength += formModel[i].orderRows[j].aluOrder.kc* formModel[i].orderRows[j].num;
                                totalArray[n].cjhfLength += formModel[i].orderRows[j].aluOrder.cjlhf* formModel[i].orderRows[j].num/1000;
				totalArray[n].totalAmount += formModel[i].orderRows[j].aluOrder.dj* formModel[i].orderRows[j].aluOrder.dkjjmj*formModel[i].orderRows[j].num;
                                if(formModel[i].orderRows[j].aluOrder.kcdj){
                                    totalArray[n].totalAmount += formModel[i].orderRows[j].aluOrder.kc* formModel[i].orderRows[j].num* formModel[i].orderRows[j].aluOrder.kcdj
                                }
                                if(formModel[i].orderRows[j].aluOrder.hfdj){
                                    totalArray[n].totalAmount += formModel[i].orderRows[j].aluOrder.cjlhf* formModel[i].orderRows[j].num*formModel[i].orderRows[j].aluOrder.hfdj/1000
                                }
                                flag = true;
                            }
                        }
                        if(!flag){
                            var item = {
                                num: formModel[i].orderRows[j].num,
                                area: formModel[i].orderRows[j].aluOrder.dkjjmj* formModel[i].orderRows[j].num,
                                amount: formModel[i].orderRows[j].aluOrder.dj* formModel[i].orderRows[j].aluOrder.dkjjmj* formModel[i].orderRows[j].num,
                                kcLength: formModel[i].orderRows[j].aluOrder.kc* formModel[i].orderRows[j].num,
                                cjhfLength: formModel[i].orderRows[j].aluOrder.cjlhf* formModel[i].orderRows[j].num/1000,
                                dj: formModel[i].orderRows[j].aluOrder.dj,
                                kcdj: formModel[i].orderRows[j].aluOrder.kcdj,
                                hfdj: formModel[i].orderRows[j].aluOrder.hfdj,
                                boardType: formModel[i].orderRows[j].aluOrder.boardType,
                                thickness: formModel[i].orderRows[j].thickness
                            }
                            
                            item.totalAmount = item.amount;
                            if(formModel[i].orderRows[j].aluOrder.kcdj){
                                item.totalAmount += item.kcLength*formModel[i].orderRows[j].aluOrder.kcdj
                            }
                            if(formModel[i].orderRows[j].aluOrder.hfdj){
                                item.totalAmount += item.cjhfLength*formModel[i].orderRows[j].aluOrder.hfdj
                            }
			    
                            totalArray.push(item);
                        }


                    }

                    formModel[i].totalArray = totalArray;
                    formModel[i].totalArray.forEach(function(sub, index){
                        numTotal += sub.num;
                        areaTotal += sub.area;
                        subTotal += sub.amount;
                        cjhfTotal += sub.cjhfLength;
                        kcTotal += sub.kcLength;
                        sum += sub.totalAmount;
                    })
                }

                this.$el.find('#item-list').append(_.template(TotalTemplate, {
                    model: formModel,
                    numTotal: numTotal,
                    areaTotal: areaTotal,
                    subTotal: subTotal,
                    cjhfTotal: cjhfTotal,
                    kcTotal: kcTotal,
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
                if(formModel[0] && formModel[0].orderRows[0] && formModel[0].orderRows[0].status == "Done"){
                    $('#top-bar-generateBtn').hide();
                }
                return this;
            },

        });
        return FormView;
    });
