define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/designRec/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Editor/AttachView',
    'common',
    'populate',
    'dataService',
    'custom',
    'constants'
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
             dataService,
             custom,
             CONSTANTS) {

    var EditView = ParentView.extend({
        contentType: 'DesignRec',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.DESIGNREC;

            self.eventChannel = options.eventChannel;          

            this.render(options);
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var endElem = target.parents('._modalSelect').find('.current-selected');
            endElem.text(target.text()).attr('data-id', target.attr('id'));
        },

        saveItem: function (event) {
            var mid = 39;
            var self = this;
            var model;
            var $currentEl = this.$el;
            //var opportunitieId = this.$el.find('#opportunitieDd').attr('data-id');
            var orderNumber = $.trim(this.$el.find('#orderNumber').val());
            var protectType = $.trim(this.$el.find('#protectType').val());
            var acreage = $.trim(this.$el.find('#acreage').val());
            var arrivalDate = $.trim(this.$el.find('#arrivalDate').val());
            var isMonitoring = this.$el.find("[name='isMonitoring']:checked").attr('data-value');
            //var employeeId = this.$el.find('#employeesDd').attr('data-id');
            var colorNumber = this.$el.find('#colorNumber').attr('data-id');
            var isReview = this.$el.find("[name='isReview']:checked").attr('data-value');

            var data = {
                orderNumber   : orderNumber,
                protectType   : protectType,
                acreage       : acreage,
                arrivalDate   : arrivalDate,
                isMonitoring  : isMonitoring,
                colorNumber   : colorNumber,
                isReview      : isReview       
            };

            event.preventDefault();

            this.currentModel.set(data);

            this.currentModel.save(this.currentModel.changed, {               
                headers: {
                    mid: mid
                },
                patch  : true,

                success: function () {
                    self.hideDialog();
                    Backbone.history.navigate('easyErp/designRec', {trigger: true});
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
            var notDiv;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 800,
                title      : 'edit designRec',
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

            this.$el.find('#arrivalDate').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });

            notDiv = this.$el.find('.attach-container');
            notDiv.append(
                new AttachView({
                    model      : this.currentModel,
                    contentType: self.contentType
                }).render().el
            );

            var opportunitieId = this.$el.find('#opportunitieDd').attr('data-id');

            dataService.getData('/colorNumber/getForDd', {building : opportunitieId}, function (colorNumber) {
                colorNumber = _.map(colorNumber.data, function (colorNumber) {
                    colorNumber.name = colorNumber.colorNumber;

                    return colorNumber;
                });

                self.responseObj['#colorNumber'] = colorNumber;
            });

            this.renderAssignees(this.currentModel);

            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
