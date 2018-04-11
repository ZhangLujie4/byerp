define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/marketSettings/CreateTemplate.html',
    'models/marketSettingsModel',
    'views/dialogViewBase',
    'common',
    'custom',
    'populate',
    'constants'
], function (Backbone, $, _, CreateTemplate, Model, dialogViewBase, common, Custom, populate, CONSTANTS) {

    var CreateView = dialogViewBase.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.MARKETSETTINGS,
        template   : _.template(CreateTemplate),
        events     : {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.collection = options.collection;
            this.model = new Model();
            this.responseObj = {};
            this.render();
        },

        saveItem: function (e) {
            var thisEl = this.$el;
            var self = this;
            var mid = 2;
            var optionName = $.trim(thisEl.find('#optionName').val());
            var optionClassid = $.trim(thisEl.find('#optionClassid').val());
            var auto = $("input[name='auto']:checked").val()?true:false;
            var url;
            var isDo = true;
            var collection = this.collection.toJSON();

            for(var i=0; i<collection.length; i++){
                if(collection[i].classid === optionClassid){
                    isDo = false;
                }
            }

            if(optionName === "" || optionClassid === ""){
                App.render({
                    type   : 'error',
                    message: '产品名称和产品编号不可为空！'
                });
            }else if(isDo){
                this.model.save(
                {
                    name    : optionName,
                    classId : optionClassid,
                    auto    : auto
                }, {
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function () {
                        url = window.location.hash;

                        Backbone.history.fragment = '';
                        Backbone.history.navigate(url, {trigger: true});
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            }else{
                App.render({
                    type   : 'error',
                    message: '该行情已存在！'
                });
            }
        },

        hideDialog: function () {
            $('.create-dialog').remove();
        },

        hideNewSelect: function (e) {
            $('.newSelectList').hide();
        },

        showNewSelect: function (e, prev, next) {
            populate.showSelect(e, prev, next, this);
            return false;
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id')).attr('data-level', $target.data('level')).attr('data-fullname', $target.data('fullname'));
        },

        render: function () {
            var self = this;
            var formString = this.template({});

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'create-dialog',
                width      : '400px',
                buttons    : [
                    {
                        text : '创建',
                        class: 'btn blue',
                        click: function () {
                            self.saveItem();
                        }
                    }, {
                        text : '取消',
                        class: 'btn',
                        click: function () {
                            self.hideDialog();
                        }
                    }]

            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;
});
