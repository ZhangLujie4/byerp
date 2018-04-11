define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/scanlogs/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Editor/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'dataService'
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
             dataService) {

    var EditView = ParentView.extend({
        contentType: 'scanlogs',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {
            'keypress #logged, #estimated': 'isNumberKey',
            'click #projectTopName'       : 'useProjectFilter'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem');
            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.SCANLOGS;

            self.eventChannel = options.eventChannel;          

            this.render(options);
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('._modalSelect').find('.current-selected');

            holder.text($target.text()).attr('data-id', $target.attr('id'));           

        },

        saveItem: function (event) {
            var mid = 39;
            var self = this;
            var model;
            var $currentEl = this.$el;
            var barId = this.$el.find('#barId').attr('data-id');
            var workCentre = this.$el.find('#workCentre').attr('data-id');
            var workGroup = this.$el.find('#workGroup').attr('data-id');
            var scantime = $.trim(this.$el.find('#scantime').val());
            var uploadtime = $.trim(this.$el.find('#uploadtime').val());
            var note = $.trim(this.$el.find('#note').val());

            var data = {
                barCode       : barId,
                workCentre    : workCentre,
                workGroup     : workGroup,
                scantime      : scantime,
                uploadtime    : uploadtime,
                note          : note            
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
                    Backbone.history.navigate('easyErp/scanlogs', {trigger: true});
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
                title      : 'edit scanlogs',
                buttons    : {
                    save: {
                        text : '修改',
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

            dataService.getData('/barCode/getById', {}, function (barCodes) {
                barCodes = _.map(barCodes.data, function (barCode) {
                    barCode.name = barCode.barId;

                    return barCode;
                });
                self.responseObj['#barId'] = barCodes;
            });

            dataService.getData('/workCentre/getForDd', {}, function (workCentres) {
                workCentres = _.map(workCentres.data, function (workCentre) {
                    workCentre.name = workCentre.name;

                    return workCentre;
                });

                self.responseObj['#workCentre'] = workCentres;
            });

            dataService.getData('/plantWorkGroup/getById', {}, function (plantWorkGroups) {
                plantWorkGroups = _.map(plantWorkGroups.data, function (plantWorkGroup) {
                    delete plantWorkGroup.status;
                    plantWorkGroup.name = plantWorkGroup.groupId;
                    return plantWorkGroup;
                });

                self.responseObj['#workGroup'] = plantWorkGroups;
            });

            this.$el.find('#scantime').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });

            this.$el.find('#uploadtime').datepicker({
                dateFormat: 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                minDate: new Date()
            });

            this.renderAssignees(this.currentModel);
            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
