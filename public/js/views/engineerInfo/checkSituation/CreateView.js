define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'views/engineerInfo/checkSituation/SaveView',
    'text!templates/engineerInfo/checkSituation/CreateTemplate.html',
    'collections/managementRule/filterCollection',
    'models/managementRuleModel',
    'models/checkSituationModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, SaveView, CreateTemplate, managementRuleCollection, managementRuleModel, checkSituationModel, moment, CONSTANTS, populate, dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'checkSituation',
        template   : _.template(CreateTemplate),
        responseObj: {},

        events: {
            'click .checkSituList td': 'goToEditDialog',
            'click #inspector'       : 'goToEditDialog'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            var self = this;

            this.engineerInfoID = options.engineerInfoID;
            self.eventChannel = options.eventChannel;
            this.timeStamp = new Date().getTime();
            self.render(options);
        },

        goToEditDialog: function(e){
            var self = this;
            var inspector = $('#inspector').val();
            var inspectDate = $('#inspectDate').val();
            var id = $(e.target).closest('tr').attr('data-id');
            var content = $(e.target).closest('tr').find('.content').text();
            var penalty = $(e.target).closest('tr').find('.penalty').text();
            var engineerInfoID = $('#engineerInfoID').attr('data-id');
            var timeStamp = $('#timeStamp').attr('data-id');
            return new SaveView({
                engineerInfoID: engineerInfoID,
                eventChannel : self.eventChannel,
                inspector    : inspector,
                inspectDate  : inspectDate,
                id           : id,
                content      : content,
                penalty      : penalty,
                timeStamp    : timeStamp
            });
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            $('.newSelectList').hide();
        },

        saveItem: function (e) {
            var self = this;
            var model;
            var $currentEl = this.$el;

            var name = $.trim($currentEl.find('#name').val());
            var jobPosition = $.trim($currentEl.find('#jobPosition').val());
            var enterTime = $.trim($currentEl.find('#enterTime').val());
            var age = $currentEl.find('#age').val();
            var jobType = $.trim($currentEl.find('#jobType').val());
            var jobQua = $.trim($currentEl.find('#jobQua').val());
            var certificate = $.trim($currentEl.find('#certificate').val());
            var phone = $.trim($currentEl.find('#phone').val());
            var remark = $.trim($currentEl.find('#remark').val());
            var data = {
                name       : name,
                jobPosition: jobPosition,
                enterTime  : enterTime,
                age        : age,
                jobType    : jobType,
                jobQua     : jobQua,
                certificate: certificate,
                phone      : phone,
                remark     : remark,
                engineerInfo: this.engineerInfoID
            };

            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            model = new checkSituationModel();
            model.urlRoot = function () {
                return 'engineerInfo/checkSituation';
            };

            model.save(data, {
                patch  : true,
                headers: {
                    mid: 103
                },
                wait   : true,
                success: function () {
                    self.hideDialog();

                    if (self.eventChannel) {
                        self.eventChannel.trigger('checkSituationUpdated');
                    }
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        hideDialog: function () {
            $('.create-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        render: function (options) {
            var self = this;
            var _id = this.engineerInfoID;
            var timeStamp = this.timeStamp;
            this.mCollection = new managementRuleCollection({
                showMore   : false,
                reset      : true,
                viewType   : 'list',
                contentType: 'checkSituation',
                url        : CONSTANTS.URLS.MANAGEMENTRULE
            });

            function createDialog(){
                var formString = self.template({
                    collection    : self.mCollection.toJSON(),
                    engineerInfoID: _id,
                    timeStamp     : timeStamp
                });

                this.$el = $(formString).dialog({
                    closeOnEscape: false,
                    autoOpen     : true,
                    resizable    : true,
                    dialogClass  : 'create-dialog',
                    title        : 'Create checkSituation',
                    width        : '1500px',
                    position     : {within: $('#wrapper')},
                    buttons      : [
                        {
                            text : '确定',
                            class: 'btn blue',
                            click: function () {
                                self.hideDialog();
                                if (self.eventChannel) {
                                    self.eventChannel.trigger('checkSituationUpdated');
                                }
                            }
                        },
                        {
                            text : '取消',
                            class: 'btn',
                            click: function () {
                                self.hideDialog();
                            }
                        }]

                });

                this.$el.find('#inspectDate').datepicker({
                    dateFormat : 'yy-mm-dd',
                    changeMonth: true,
                    changeYear : true,
                    monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                    dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
                    monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                    dayNamesMin: ['日','一','二','三','四','五','六'],
                });

                $('.checkSituList td').click(self.goToEditDialog);
            }

            self.mCollection.unbind();
            self.mCollection.bind('reset', createDialog);

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
