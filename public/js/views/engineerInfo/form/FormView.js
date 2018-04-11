define([
        'Backbone',
        'jQuery',
        'Underscore',
        'text!templates/engineerInfo/form/FormTemplate.html',
        'collections/engineerManager/filterCollection',
        'collections/jobForeman/filterCollection',
        'collections/checkSituation/filterCollection',
        'models/engineerInfoModel',
        'models/engineerManagerModel',
        'models/jobForemanModel',
        'models/checkSituationModel',
        'views/engineerInfo/engineerManager/engineerManagerView',
        'views/engineerInfo/jobForeman/jobForemanView',
        'views/engineerInfo/checkSituation/checkSituationView',
        'views/selectView/selectView',
        'constants',
        'async',
        'distpicker'
    ],
    function (Backbone, 
              $, 
              _, 
              FormTemplate, 
              engineerManagerCollection, 
              jobForemanCollection, 
              checkSituationCollection,
              engineerInfoModel, 
              engineerManagerModel, 
              jobForemanModel,
              checkSituationModel,
              engineerManagerView,
              jobForemanView,
              checkSituationView,
              SelectView,
              CONSTANTS,
              async,
              distpicker) {
        'use strict';

        var FormView = Backbone.View.extend({
            el         : '#content-holder',
            responseObj: {},
            SelectView : SelectView,

            events: {
                'click .chart-tabs'                                                                    : 'changeTab',
                'click .newSelectList li:not(.miniStylePagination):not(.disabled)'                     : 'chooseOption',
                'click .current-selected:not(.disabled)'                                               : 'showNewSelect',
                click                                                                                  : 'hideSelect',
                'change input:not(.checkbox, .checkAll, .statusCheckbox, #inputAttach, #noteTitleArea)': 'showSaveButton',
                'change select'                                                                        : 'showSaveButton',
            },
            initialize: function (options) {

                var eventChannel = {};

                _.extend(eventChannel, Backbone.Events);
                this.eventChannel = eventChannel;
                this.formModel = options.model;
                this.formModel.urlRoot = '/engineerInfo/';
                this.id = this.formModel.id;
                this.responseObj['#fileStatus'] = [
                    {
                        _id : 'complete',
                        name: '完备'
                    },
                    {
                        _id : 'lack',
                        name: '暂缺'
                    }
                ];

                this.listenTo(eventChannel, 'engineerManagerUpdated engineerManagerRemove', this.getEngineerManager);
                this.listenTo(eventChannel, 'jobForemanUpdated jobForemanRemove', this.getJobForeman);
                this.listenTo(eventChannel, 'checkSituationUpdated checkSituationRemove', this.getCheckSituation);
            },

            changeTab: function (e) {
                var target = $(e.target);
                var $aEllement = target.closest('a');
                var n;
                var dialogHolder;

                App.projectInfo = App.projectInfo || {};

                App.projectInfo.currentTab = $aEllement.attr('id').slice(0, -3);  // todo id

                target.closest('.chart-tabs').find('a.active').removeClass('active');
                $aEllement.addClass('active');
                n = target.parents('.chart-tabs').find('li').index($aEllement.parent());
                dialogHolder = $('.dialog-tabs-items');
                dialogHolder.find('.dialog-tabs-item.active').removeClass('active');
                dialogHolder.find('.dialog-tabs-item').eq(n).addClass('active');
            },

            chooseOption: function (e) {
                $(e.target).parents('dd').find('.current-selected').text($(e.target).text()).attr('data-id', $(e.target).attr('id'));
                this.showSaveButton();
            },

            showNewSelect: function (e) {
                var $target = $(e.target);
                e.stopPropagation();

                if ($target.attr('id') === 'selectInput') {
                    return false;
                }

                if (this.selectView) {
                    this.selectView.remove();
                }

                this.selectView = new this.SelectView({
                    e          : e,
                    responseObj: this.responseObj
                });

                $target.append(this.selectView.render().el);

                return false;
            },

            hideNewSelect: function () {
                $('.newSelectList').hide();
                $('#health ul').hide();
            },

            nextSelect: function (e) {
                this.showNewSelect(e, false, true);
            },

            prevSelect: function (e) {
                this.showNewSelect(e, true, false);
            },

            showSaveButton: function () {
                $('#top-bar-saveBtn').show();
            },

            hideSaveButton: function () {
                $('#top-bar-saveBtn').hide();
            },

            getEngineerManager: function (cb) {
                var _id = this.id;
                var self = this;
                
                var filter = {
                    project: {
                        key  : 'engineerInfo._id',
                        value: [_id]
                    }
                };
                this.eCollection = new engineerManagerCollection({
                    showMore   : false,
                    reset      : true,
                    viewType   : 'list',
                    contentType: 'engineerManager',
                    url        : CONSTANTS.URLS.ENGINEERINFO + _id + '/engineerManager'
                });

                function createView() {

                    if (cb) {
                        cb();
                    }

                    new engineerManagerView({
                        collection      : self.eCollection,
                        engineerInfoID  : _id,
                        filter          : filter,
                        model           : self.formModel,
                        eventChannel    : self.eventChannel
                    }).render();

                }

                self.eCollection.unbind();
                self.eCollection.bind('reset', createView);
                this.eCollection.bind('add remove', self.renderProformRevenue);
            },

            getJobForeman: function(cb){
                var _id = this.id;
                var self = this;

                var filter = {
                    project: {
                        key  : 'engineerInfo._id',
                        value: [_id]
                    }
                };
                this.jCollection = new jobForemanCollection({
                    showMore   : false,
                    reset      : true,
                    viewType   : 'list',
                    contentType: 'jobForeman',
                    url        : CONSTANTS.URLS.ENGINEERINFO + _id + '/jobForeman'
                });

                function createView() {

                    if (cb) {
                        cb();
                    }

                    new jobForemanView({
                        collection      : self.jCollection,
                        engineerInfoID  : _id,
                        filter          : filter,
                        model           : self.formModel,
                        eventChannel    : self.eventChannel
                    }).render();

                }

                self.jCollection.unbind();
                self.jCollection.bind('reset', createView);
                this.jCollection.bind('add remove', self.renderProformRevenue);
            },

            getCheckSituation: function(cb){
                var _id = this.id;
                var self = this;

                var filter = {
                    project: {
                        key  : 'engineerInfo._id',
                        value: [_id]
                    }
                };
                this.cCollection = new checkSituationCollection({
                    showMore   : false,
                    reset      : true,
                    viewType   : 'list',
                    contentType: 'checkSituation',
                    url        : CONSTANTS.URLS.ENGINEERINFO + _id + '/checkSituation'
                });

                function createView() {

                    if (cb) {
                        cb();
                    }

                    new checkSituationView({
                        collection      : self.cCollection,
                        engineerInfoID  : _id,
                        filter          : filter,
                        model           : self.formModel,
                        eventChannel    : self.eventChannel
                    }).render();

                }

                self.cCollection.unbind();
                self.cCollection.bind('reset', createView);
                this.cCollection.bind('add remove', self.renderProformRevenue);
            },

            saveItem: function() {
                var self = this;
                var mid = 39;
                var name = $.trim(this.$el.find('#name').val());
                var quality = $.trim(this.$el.find('#quality').val());
                var issArea = this.$el.find('#issArea').val();
                var amount = this.$el.find('#amount').val();
                var StartDate = $.trim(this.$el.find('#StartDate').val());
                var EndDate = $.trim(this.$el.find('#EndDate').val());
                var pmr = $.trim(this.$el.find('#pmr').val());
                var pmv = $.trim(this.$el.find('#pmv').val());
                var materialMember = $.trim(this.$el.find('#materialMember').val());
                var securityOfficer = $.trim(this.$el.find('#securityOfficer').val());
                var qualityInspector = $.trim(this.$el.find('#qualityInspector').val());
                var constructionWorker = $.trim(this.$el.find('#constructionWorker').val());
                var informationOfficer = $.trim(this.$el.find('#informationOfficer').val());
                var cancelDate = $.trim(this.$el.find('#cancelDate').val());
                var address = {
                    province: $.trim(this.$el.find('#province option:selected').val()),
                    city    : $.trim(this.$el.find('#city option:selected').val()),
                    district: $.trim(this.$el.find('#district option:selected').val()),
                    zip     : $.trim(this.$el.find('#zip').val())
                };
                var constructionUnit = $.trim(this.$el.find('#constructionUnit').val());
                var supervisionUnit = $.trim(this.$el.find('#supervisionUnit').val());
                var contractUnit = $.trim(this.$el.find('#contractUnit').val());
                var fileStatus = $.trim(this.$el.find('#fileStatus').data('id'));
                var data = {
                    name: name,
                    quality: quality,
                    issArea: issArea,
                    amount: amount,
                    StartDate: StartDate,
                    EndDate : EndDate,
                    pmr: pmr,
                    pmv: pmv,
                    materialMember: materialMember,
                    securityOfficer: securityOfficer,
                    qualityInspector: qualityInspector,
                    constructionWorker: constructionUnit,
                    informationOfficer: informationOfficer,
                    cancelDate: cancelDate,
                    address: address,
                    constructionUnit: constructionUnit,
                    supervisionUnit: supervisionUnit,
                    contractUnit: contractUnit,
                    fileStatus: fileStatus
                };

                this.formModel.save(data, {
                    patch  : true,
                    headers: {
                        mid: mid
                    },
                    success: function(){
                        self.hideSaveButton();

                        App.render({
                            type   : 'notify',
                            message: '数据已更新，请刷新浏览器'
                        });
                    },
                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            },

            render: function () {

                var formModel = this.formModel.toJSON();


                this.$el.html(_.template(FormTemplate, {
                    model: formModel
                }));

                _.bindAll(this, 'getEngineerManager','getJobForeman', 'getCheckSituation');
                var paralellTasks = [this.getEngineerManager, this.getJobForeman, this.getCheckSituation];

                async.parallel(paralellTasks, function(err, result) {
                     App.stopPreload();
                     $('#top-bar-createBtn').remove();
                });

                // this.getEngineerManager();
                // this.getJobForeman();

                this.$el.find('#StartDate').datepicker({
                    dateFormat : 'yy-mm-dd',
                    changeMonth: true,
                    changeYear : true,
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                    monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                });

                this.$el.find('#EndDate').datepicker({
                    dateFormat : 'yy-mm-dd',
                    changeMonth: true,
                    changeYear : true,
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                    monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                });

                this.$el.find('#cancelDate').datepicker({
                    dateFormat : 'yy-mm-dd',
                    changeMonth: true,
                    changeYear : true,
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                    monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                });

                this.$el.find('#address').distpicker({
                    province: formModel.address.province,
                    city: formModel.address.city,
                    district: formModel.address.district
                });

                $('#top-bar-deleteBtn').hide();
                $('#top-bar-saveBtn').hide();
                return this;
            },

        });
        return FormView;
    });
