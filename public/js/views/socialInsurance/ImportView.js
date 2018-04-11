define([
    'jQuery',
    'Underscore',
    'Backbone',
    'views/dialogViewBase',
    'views/Notes/AttachView',
    'text!templates/socialInsurance/ImportTemplate.html',
    'models/socialInsuranceModel',
    'moment',
    'constants',
    'populate',
    'dataService'
], function ($, _, Backbone, ParentView, AttachView, ImportTemplate, socialInsuranceModel, moment, CONSTANTS, populate, dataService) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'socialInsurance',
        template   : _.template(ImportTemplate),
        responseObj: {},
       
        events: {
            'click #upload-file-btn' : 'uploadFile'
        },

        initialize: function (options) {
            this.model = new socialInsuranceModel();
            var self = this;

            self.eventChannel = options.eventChannel;

            self.render(options);
        },

        uploadFile: function (e) {
            var date = $('.monthPicker').val();
            date = new Date(date);
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var datekey = year * 100 + month;
            var formData = new FormData();
            formData.append('file', $('#file')[0].files[0]);
            console.log($('#file')[0].files[0]);
            $.ajax({
                url: '/socialInsurance/importCityHealth/' + datekey,
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
            this.$el.find('.input-file .inputAttach').click();
        },



        render: function (options) {
            var formString = this.template();
            var self = this;
            var $notDiv;
            this.attachView = new AttachView({
                model      : new socialInsuranceModel(),
                contentType: this.contentType,
                isCreate   : true
            });
            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Create socialInsurance',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        text : '取消',
                        class: 'btn blue',
                        click: function () {
                            self.hideDialog();
                        }
                    }]

            });

            $notDiv = this.$el.find('.attach-container');
            

            $notDiv.append(this.attachView.render().el);
            

            now = new Date();
            self.month = now.getMonth();
            self.year = now.getFullYear();

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

            this.delegateEvents(this.events);

            return this;
        }

    });

    return CreateView;
});
