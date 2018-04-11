/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/depRoyalty/CreateTemplate.html',
    'models/depRoyaltyModel',
    'views/dialogViewBase',
    'common',
    'custom',
    'populate',
    'constants',
    'helpers'
], function (Backbone, $, _, CreateTemplate, Model, dialogViewBase, common, Custom, populate, CONSTANTS, helpers) {

    var CreateView = dialogViewBase.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.DEPROYALTY,
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
            var collection = this.collection.toJSON();
            var year = this.$el.find('#year').val();
            var isDo = false;

            for(var i=0; i<collection.length; i++){
                if(collection[i].year.toString() === year){
                    isDo = true;
                }
            }

            if(year){
                if(!isDo){
                    this.model.save(
                        {
                            year : year
                        }, {
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
                    return App.render({
                        type   : 'error',
                        message: '当年商务部提成已导入，请检查年份是否填错！'
                    });
                }
            }else{
                return App.render({
                    type   : 'error',
                    message: '年份不可为空！'
                });
            }

        },

        hideDialog: function () {
            $('.create-dialog').remove();
        },

        render: function () {
            var self = this;
            var formString = this.template({});

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'create-dialog',
                width      : '300px',
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
            return this;
        }
    });

    return CreateView;
});
