/**
 * Created by wmt on 2017/8/1.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/royaltyDetails/CreateTemplate.html',
    'models/depRoyaltyModel',
    'views/dialogViewBase',
    'common',
    'custom',
    'populate',
    'constants',
    'helpers',
    'dataService'
], function (Backbone, $, _, CreateTemplate, Model, dialogViewBase, common, Custom, populate, CONSTANTS, helpers, dataService) {

    var CreateView = dialogViewBase.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.ROYALTYDETAILS,
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
                if(collection[i].project.biderDate.substring(0, 4) === year){
                    isDo = true;
                }
            }

            if(year){
                if(!isDo){

                    dataService.postData('/royaltyDetails', {year: year}, function (err, response) {
                        if(err){
                            return App.render({
                                type   : 'error',
                                message: err
                            });
                        }

                        if(response !== "暂无此年份的投标工程！"){
                            url = window.location.hash;
                            Backbone.history.fragment = '';
                            Backbone.history.navigate(url, {trigger: true});
                        }else{
                            return App.render({
                                type   : 'error',
                                message: response
                            });
                        }

                    });
                }else{
                    return App.render({
                        type   : 'error',
                        message: '当年已导入！'
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