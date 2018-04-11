define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'text!templates/timeCard/CreateTemplate.html',
    'models/timeCardModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, AttachView, CreateTemplate, timeCardModel, moment, CONSTANTS, populate, dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'timeCard',
        template   : _.template(CreateTemplate),
        responseObj: {},
       
        events: {
            'click #upload-file-btn' : 'uploadFile'
        },

        initialize: function (options) {
            this.model = new timeCardModel();
            var self = this;

            self.eventChannel = options.eventChannel;

            self.render(options);
        },

        // keyDownHandler: function (e) {
        //     if (e.which === 13) {
        //         this.saveItem(e);
        //     }
        // },

        chooseOption: function (e) {
            var $target = $(e.target);
            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
            console.log($target.parents('dd').find('.current-selected').text());
            $('.newSelectList').hide();
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
            $('.crop-images-dialog').remove();
        },

        import: function(){
            // var currentUser = App.currentUser;
            // var importData = currentUser.imports;

            // var url = '/attendanceManagement/importFile';

            // dataService.postData(url, importData, function (err, result) {
            //     console.log(result);
            // });
            this.$el.find('.input-file .inputAttach').click();
        },

        uploadFile: function (e) {
            var date = $('.monthPicker').val();
            date = new Date(date);
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var datekey = year * 100 + month;
            var formData = new FormData();
            formData.append('file', $('#file')[0].files[0]);
            $.ajax({
                url: '/timeCard/importFile/'+ datekey,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                cache      : false,
                success: function(result){

                    var url1 = window.location.hash;
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(url1, {trigger: true});
                },
                error: function(){
                    App.render({
                        type   : 'error',
                        message: 'Wrong Password or such user doesn\'t registered'
                    });
                }
            });
        },

        render: function (options) {
            var formString = this.template();
            var self = this;
            var $notDiv;
            this.attachView = new AttachView({
                model      : new timeCardModel(),
                contentType: this.contentType,
                isCreate   : true
            });
            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Create timeCard',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-timeCard-dialog',
                        class: 'btn blue',
                        text : '选择',
                        click: function () {
                            self.import();
                        }
                    },

                    // {
                    //     id   : 'generate-attendanceManagement-dialog',
                    //     class: 'btn blue',
                    //     text : '处理',
                    //     click: function () {
                    //         // var currentModel = this.model.changed;
                    //         console.log(this.model);
                    //         self.attachView.sendToServer(null, this.model);
                    //     }
                    // },

                    {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }]

            });

            $('.monthPicker').val($.datepicker.formatDate('yy-mm', new Date()));
            $('.monthPicker').datepicker({
                dateFormat       : 'yy-mm',
                changeMonth      : true,
                changeYear       : true,
                currentText      : '今天', 
                closeText        : '确定',
                showButtonPanel  : true,
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                onChangeMonthYear: function (year, month, inst) {
                    self.month = $('#ui-datepicker-div .ui-datepicker-month :selected').val();
                    self.year = $('#ui-datepicker-div .ui-datepicker-year :selected').val();
                    $(this).val($.datepicker.formatDate('yy-mm', new Date(self.year, self.month, 1)));
                },
                onClose          : function (dateText, inst) {
                    self.month = $('#ui-datepicker-div .ui-datepicker-month :selected').val();
                    self.year = $('#ui-datepicker-div .ui-datepicker-year :selected').val();
                    $(this).val($.datepicker.formatDate('yy-mm', new Date(self.year, self.month, 1)));
                }
            }).focus(function () {
                $('.ui-datepicker-calendar').hide();
                $('#ui-datepicker-div').position({
                    my: 'center top',
                    at: 'center bottom',
                    of: $(this)
                });
            });

            $notDiv = this.$el.find('.attach-container');
            

            $notDiv.append(this.attachView.render().el);
    
            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
