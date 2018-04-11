define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/orderReckons/CreateTemplate.html',
    'models/OrderReckonsModel',
    'common',
    'populate',
    'dataService',
    'views/Notes/AttachView',
    'views/selectView/selectView',
    'constants'
], function (Backbone, $, _, ParentView, CreateTemplate, OrderReckonsModel, common, populate, dataService, AttachView, SelectView, CONSTANTS) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'OrderReckons',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click #deadline'      : 'showDatePicker',
            'change #workflowNames': 'changeWorkflows'
            //'click .addItem a'     : 'getItem',
            //'click .removeItem'    : 'deleteRow',
        },

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new OrderReckonsModel();
            this.model2 = new OrderReckonsModel();
            this.model3 = new OrderReckonsModel();
            this.model4 = new OrderReckonsModel();
            this.model5 = new OrderReckonsModel(); 
            
            this.render();
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

        /*getItem:function(e){
            var target = $(e.target);
            var $parrent = target.closest('tbody');
            var templ = _.template(OrderItems);
            var $trEll = $parrent.find('tr.orderItem');
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

        },*/

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
            var opportunitieId = this.$el.find('#opportunitieDd').attr('data-id');
            var workNumber = this.$el.find('#workNumber').attr('data-id');
            var processContent = this.$el.find('#processContent').attr('data-id');
            var price = $.trim(this.$el.find('#price').val());
            var employeeQuantity = $.trim(this.$el.find('#processQuantity').val());
            var employeeId = this.$el.find('#employeesDd').attr('data-id');

            var opportunitieId2 = this.$el.find('#opportunitieDd2').attr('data-id');
            var workNumber2 = this.$el.find('#workNumber2').attr('data-id');
            var processContent2 = this.$el.find('#processContent2').attr('data-id');
            var price2 = $.trim(this.$el.find('#price2').val());
            var employeeQuantity2 = $.trim(this.$el.find('#processQuantity2').val());

            var opportunitieId3 = this.$el.find('#opportunitieDd3').attr('data-id');
            var workNumber3 = this.$el.find('#workNumber3').attr('data-id');
            var processContent3 = this.$el.find('#processContent3').attr('data-id');
            var price3 = $.trim(this.$el.find('#price3').val());
            var employeeQuantity3 = $.trim(this.$el.find('#processQuantity3').val());

            var opportunitieId4 = this.$el.find('#opportunitieDd4').attr('data-id');
            var workNumber4 = this.$el.find('#workNumber4').attr('data-id');
            var processContent4 = this.$el.find('#processContent4').attr('data-id');
            var price4 = $.trim(this.$el.find('#price4').val());
            var employeeQuantity4 = $.trim(this.$el.find('#processQuantity4').val());

            var opportunitieId5 = this.$el.find('#opportunitieDd5').attr('data-id');
            var workNumber5 = this.$el.find('#workNumber5').attr('data-id');
            var processContent5 = this.$el.find('#processContent5').attr('data-id');
            var price5 = $.trim(this.$el.find('#price5').val());
            var employeeQuantity5 = $.trim(this.$el.find('#processQuantity5').val());

            if(opportunitieId){
                this.model.save(                
                        {
                            projectName      : opportunitieId || null,
                            workNumber       : workNumber,
                            processContent   : processContent || null,
                            price            : price,
                            employeeQuantity : employeeQuantity,
                            employeeName     : employeeId || null,                   

                        },
                        {
                            headers: {
                                mid: mid
                            },
                            wait   : true,
                            success: function (model) {
                                /*var currentModel = model.changed;

                                self.attachView.sendToServer(null, currentModel);*/
                                Backbone.history.navigate('easyErp/orderReckons', {trigger: true});
                            },

                            error: function (model, xhr) {
                                self.errorNotification(xhr);
                            }

                        });
            }

            if(opportunitieId2){
                this.model2.save(                
                    {
                        projectName      : opportunitieId2 || null,
                        workNumber       : workNumber2,
                        processContent   : processContent2 || null,
                        price            : price2,
                        employeeQuantity : employeeQuantity2,
                        employeeName     : employeeId || null,                   

                    },
                    {
                        headers: {
                            mid: mid
                        },
                        wait   : true,
                        success: function (model2) {
                            /*var currentModel = model.changed;

                            self.attachView.sendToServer(null, currentModel);*/
                            Backbone.history.navigate('easyErp/orderReckons', {trigger: true});
                        },

                        error: function (model2, xhr) {
                            self.errorNotification(xhr);
                        }

                    });
            }

            if(opportunitieId3){
                this.model3.save(                
                    {
                        projectName      : opportunitieId3 || null,
                        workNumber       : workNumber3,
                        processContent   : processContent3 || null,
                        price            : price3,
                        employeeQuantity : employeeQuantity3,
                        employeeName     : employeeId || null,                   

                    },
                    {
                        headers: {
                            mid: mid
                        },
                        wait   : true,
                        success: function (model3) {
                            /*var currentModel = model.changed;

                            self.attachView.sendToServer(null, currentModel);*/
                            Backbone.history.navigate('easyErp/orderReckons', {trigger: true});
                        },

                        error: function (model3, xhr) {
                            self.errorNotification(xhr);
                        }

                    });
            }

            if(opportunitieId4){
                this.model4.save(                
                    {
                        projectName      : opportunitieId4 || null,
                        workNumber       : workNumber4,
                        processContent   : processContent4 || null,
                        price            : price4,
                        employeeQuantity : employeeQuantity4,
                        employeeName     : employeeId || null,                   

                    },
                    {
                        headers: {
                            mid: mid
                        },
                        wait   : true,
                        success: function (model4) {
                            /*var currentModel = model.changed;

                            self.attachView.sendToServer(null, currentModel);*/
                            Backbone.history.navigate('easyErp/orderReckons', {trigger: true});
                        },

                        error: function (model4, xhr) {
                            self.errorNotification(xhr);
                        }

                    });
            }

            if(opportunitieId5){
                this.model5.save(                
                    {
                        projectName      : opportunitieId5 || null,
                        workNumber       : workNumber5,
                        processContent   : processContent5 || null,
                        price            : price5,
                        employeeQuantity : employeeQuantity5,
                        employeeName     : employeeId || null,                   

                    },
                    {
                        headers: {
                            mid: mid
                        },
                        wait   : true,
                        success: function (model5) {
                            /*var currentModel = model.changed;

                            self.attachView.sendToServer(null, currentModel);*/
                            Backbone.history.navigate('easyErp/orderReckons', {trigger: true});
                        },

                        error: function (model5, xhr) {
                            self.errorNotification(xhr);
                        }

                    });
            }

        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('._modalSelect').find('.current-selected');           

            if (holder.attr('id') === 'opportunitieDd') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectProject($(e.target).attr('id'));
            }

            else if (holder.attr('id') === 'opportunitieDd2') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectProject2($(e.target).attr('id'));
            }

            else if (holder.attr('id') === 'opportunitieDd3') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectProject3($(e.target).attr('id'));
            }

            else if (holder.attr('id') === 'opportunitieDd4') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectProject4($(e.target).attr('id'));
            }

            else if (holder.attr('id') === 'opportunitieDd5') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectProject5($(e.target).attr('id'));
            }

            else if (holder.attr('id') === 'workNumber') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectWorkNumber($(e.target).attr('id'));
            } 

            else if (holder.attr('id') === 'workNumber2') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectWorkNumber2($(e.target).attr('id'));
            } 

            else if (holder.attr('id') === 'workNumber3') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectWorkNumber3($(e.target).attr('id'));
            } 

            else if (holder.attr('id') === 'workNumber4') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectWorkNumber4($(e.target).attr('id'));
            } 

            else if (holder.attr('id') === 'workNumber5') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                this.selectWorkNumber5($(e.target).attr('id'));
            } 

            else if (holder.attr('id') === 'processContent') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                var opid = this.$el.find('#opportunitieDd').data('id');

                dataService.getData( '/workOrders/getWorkOrder', {
                    _id: opid
                }, function (response, context) {
                    var workOrder = response;
                    if (workOrder) {
                        var work = workOrder.data[0];
                        var price;
                        for(var i = 0; i < work.processContents.length; i++){
                            if(work.processContents[i].processContent == $target.attr('id')){
                                price = work.processContents[i].price;

                            }
                        }
                        context.$el.find('#price').val(price);

                    }
                }, this);
                                
            }

            else if (holder.attr('id') === 'processContent2') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                var opid = this.$el.find('#opportunitieDd2').data('id');

                dataService.getData( '/workOrders/getWorkOrder', {
                    _id: opid
                }, function (response, context) {
                    var workOrder = response;
                    if (workOrder) {
                        var work = workOrder.data[0];
                        var price;
                        for(var i = 0; i < work.processContents.length; i++){
                            if(work.processContents[i].processContent == $target.attr('id')){
                                price = work.processContents[i].price;

                            }
                        }
                        context.$el.find('#price2').val(price);

                    }
                }, this);
                                
            }

            else if (holder.attr('id') === 'processContent3') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                var opid = this.$el.find('#opportunitieDd3').data('id');

                dataService.getData( '/workOrders/getWorkOrder', {
                    _id: opid
                }, function (response, context) {
                    var workOrder = response;
                    if (workOrder) {
                        var work = workOrder.data[0];
                        var price;
                        for(var i = 0; i < work.processContents.length; i++){
                            if(work.processContents[i].processContent == $target.attr('id')){
                                price = work.processContents[i].price;

                            }
                        }
                        context.$el.find('#price3').val(price);

                    }
                }, this);
                                
            }

            else if (holder.attr('id') === 'processContent4') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                var opid = this.$el.find('#opportunitieDd4').data('id');

                dataService.getData( '/workOrders/getWorkOrder', {
                    _id: opid
                }, function (response, context) {
                    var workOrder = response;
                    if (workOrder) {
                        var work = workOrder.data[0];
                        var price;
                        for(var i = 0; i < work.processContents.length; i++){
                            if(work.processContents[i].processContent == $target.attr('id')){
                                price = work.processContents[i].price;

                            }
                        }
                        context.$el.find('#price4').val(price);

                    }
                }, this);
                                
            }

            else if (holder.attr('id') === 'processContent5') {
                holder.text($target.text()).attr('data-id', $target.attr('id'));
                var opid = this.$el.find('#opportunitieDd5').data('id');

                dataService.getData( '/workOrders/getWorkOrder', {
                    _id: opid
                }, function (response, context) {
                    var workOrder = response;
                    if (workOrder) {
                        var work = workOrder.data[0];
                        var price;
                        for(var i = 0; i < work.processContents.length; i++){
                            if(work.processContents[i].processContent == $target.attr('id')){
                                price = work.processContents[i].price;

                            }
                        }
                        context.$el.find('#price5').val(price);

                    }
                }, this);
                                
            }

            else{
                holder.text($target.text()).attr('data-id', $target.attr('id'));
            }
        },

        selectWorkNumber: function (id) {

            if (id !== '') {
                dataService.getData( '/workOrders/getProcess', {
                    _id: id
                }, function (response, context) {
                    var workOrder = response;
                    
                    if (workOrder) {
                        var work = workOrder.data[0];
                        work.processContents = _.map(work.processContents, function (processContent) {
                            processContent = {
                                _id   : processContent.processContent,
                                name  : processContent.processContent,
                                price : processContent.price
                            }

                            return processContent;
                        });

                        context.responseObj['#processContent'] = work.processContents;

                    }
                }, this);
            } else {
                this.$el.find('#price').val('');
            }

        },

        selectWorkNumber2: function (id) {

            if (id !== '') {
                dataService.getData( '/workOrders/getProcess', {
                    _id: id
                }, function (response, context) {
                    var workOrder = response;
                    
                    if (workOrder) {
                        var work = workOrder.data[0];
                        work.processContents = _.map(work.processContents, function (processContent) {
                            processContent = {
                                _id   : processContent.processContent,
                                name  : processContent.processContent,
                                price : processContent.price
                            }

                            return processContent;
                        });

                        context.responseObj['#processContent2'] = work.processContents;

                    }
                }, this);
            } else {
                this.$el.find('#price2').val('');
            }

        },

        selectWorkNumber3: function (id) {

            if (id !== '') {
                dataService.getData( '/workOrders/getProcess', {
                    _id: id
                }, function (response, context) {
                    var workOrder = response;
                    
                    if (workOrder) {
                        var work = workOrder.data[0];
                        work.processContents = _.map(work.processContents, function (processContent) {
                            processContent = {
                                _id   : processContent.processContent,
                                name  : processContent.processContent,
                                price : processContent.price
                            }

                            return processContent;
                        });

                        context.responseObj['#processContent3'] = work.processContents;

                    }
                }, this);
            } else {
                this.$el.find('#price3').val('');
            }

        },

        selectWorkNumber4: function (id) {

            if (id !== '') {
                dataService.getData( '/workOrders/getProcess', {
                    _id: id
                }, function (response, context) {
                    var workOrder = response;
                    
                    if (workOrder) {
                        var work = workOrder.data[0];
                        work.processContents = _.map(work.processContents, function (processContent) {
                            processContent = {
                                _id   : processContent.processContent,
                                name  : processContent.processContent,
                                price : processContent.price
                            }

                            return processContent;
                        });

                        context.responseObj['#processContent4'] = work.processContents;

                    }
                }, this);
            } else {
                this.$el.find('#price4').val('');
            }

        },

        selectWorkNumber5: function (id) {

            if (id !== '') {
                dataService.getData( '/workOrders/getProcess', {
                    _id: id
                }, function (response, context) {
                    var workOrder = response;
                    
                    if (workOrder) {
                        var work = workOrder.data[0];
                        work.processContents = _.map(work.processContents, function (processContent) {
                            processContent = {
                                _id   : processContent.processContent,
                                name  : processContent.processContent,
                                price : processContent.price
                            }

                            return processContent;
                        });

                        context.responseObj['#processContent5'] = work.processContents;

                    }
                }, this);
            } else {
                this.$el.find('#price5').val('');
            }

        },

        selectProject: function (id) {

            if (id !== '') {
                dataService.getData( '/workOrders/getWorkOrder', {
                    _id: id
                }, function (response, context) {
                    var workOrder = response;

                    if (workOrder) {
                        var workNumber;

                        workNumber = _.map(workOrder.data, function (workNumber) {
                            workNumber = {
                                _id   : workNumber.workNumber,
                                name  : workNumber.workNumber
                            }

                            return workNumber;
                        });

                        context.responseObj['#workNumber'] = workNumber;                       

                    }
                }, this);
            } else {
                this.$el.find('#workNumber').val('');
            }

        },

        selectProject2: function (id) {

            if (id !== '') {
                dataService.getData( '/workOrders/getWorkOrder', {
                    _id: id
                }, function (response, context) {
                    var workOrder = response;

                    if (workOrder) {
                        var workNumber;

                        workNumber = _.map(workOrder.data, function (workNumber) {
                            workNumber = {
                                _id   : workNumber.workNumber,
                                name  : workNumber.workNumber
                            }

                            return workNumber;
                        });

                        context.responseObj['#workNumber2'] = workNumber;                       

                    }
                }, this);
            } else {
                this.$el.find('#workNumber2').val('');
            }

        },

        selectProject3: function (id) {

            if (id !== '') {
                dataService.getData( '/workOrders/getWorkOrder', {
                    _id: id
                }, function (response, context) {
                    var workOrder = response;

                    if (workOrder) {
                        var workNumber;

                        workNumber = _.map(workOrder.data, function (workNumber) {
                            workNumber = {
                                _id   : workNumber.workNumber,
                                name  : workNumber.workNumber
                            }

                            return workNumber;
                        });

                        context.responseObj['#workNumber3'] = workNumber;                       

                    }
                }, this);
            } else {
                this.$el.find('#workNumber3').val('');
            }

        },

        selectProject4: function (id) {

            if (id !== '') {
                dataService.getData( '/workOrders/getWorkOrder', {
                    _id: id
                }, function (response, context) {
                    var workOrder = response;

                    if (workOrder) {
                        var workNumber;

                        workNumber = _.map(workOrder.data, function (workNumber) {
                            workNumber = {
                                _id   : workNumber.workNumber,
                                name  : workNumber.workNumber
                            }

                            return workNumber;
                        });

                        context.responseObj['#workNumber4'] = workNumber;                       

                    }
                }, this);
            } else {
                this.$el.find('#workNumber4').val('');
            }

        },

        selectProject5: function (id) {

            if (id !== '') {
                dataService.getData( '/workOrders/getWorkOrder', {
                    _id: id
                }, function (response, context) {
                    var workOrder = response;

                    if (workOrder) {
                        var workNumber;

                        workNumber = _.map(workOrder.data, function (workNumber) {
                            workNumber = {
                                _id   : workNumber.workNumber,
                                name  : workNumber.workNumber
                            }

                            return workNumber;
                        });

                        context.responseObj['#workNumber5'] = workNumber;                       

                    }
                }, this);
            } else {
                this.$el.find('#workNumber5').val('');
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
                title        : 'Create OrderReckon',
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

            /*dataService.getData('/workOrders/getOpportunitie', {}, function (opportunities) {
                opportunities = _.map(opportunities.data, function (opportunitie) {
                    opportunitie.name = opportunitie.name;

                    return opportunitie;
                });

                self.responseObj['#opportunitieDd'] = opportunities;
            });*/

            dataService.getData('/workOrders/getApprovalOrder', {}, function (workOrders) {
                workOrders = _.map(workOrders.data, function (workOrder) {
                    workOrder._id = workOrder.projectName._id;
                    workOrder.name = workOrder.projectName.name;

                    return workOrder;
                });

                self.responseObj['#opportunitieDd'] = workOrders;
                self.responseObj['#opportunitieDd2'] = workOrders;
                self.responseObj['#opportunitieDd3'] = workOrders;
                self.responseObj['#opportunitieDd4'] = workOrders;
                self.responseObj['#opportunitieDd5'] = workOrders;
            });

            populate.get2name('#employeesDd', CONSTANTS.URLS.EMPLOYEES_PERSONSFORDD, {},  this, true, true);

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
