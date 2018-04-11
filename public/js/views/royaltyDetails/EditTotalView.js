/**
 * Created by wmt on 2017/8/2.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/royaltyDetails/EditTemplate.html',
    'models/royaltyDetailsModel',
    'views/dialogViewBase',
    'common',
    'custom',
    'populate',
    'constants',
    'helpers',
    'dataService'
], function (Backbone, $, _, EditTemplate, Model, dialogViewBase, common, Custom, populate, CONSTANTS, helpers, dataService) {

    var EditView = dialogViewBase.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.ROYALTYDETAILS,
        template   : _.template(EditTemplate),
        events     : {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.model = options.model;
            this.responseObj = {};
            this.render();
        },

        saveItem: function (e) {
            var _id = this.model._id;
            var comRate = parseInt(this.$el.find('#comRate').val())?parseInt(this.$el.find('#comRate').val()):0;
            var message = "";
            var year = this.model.year;

            if(!comRate){
                message = "提成比例不可为空！";
            }else if(comRate === this.model.comRate){
                message = "您没有修改原来的数据！";
            }

            if(message === ""){
                dataService.patchData('/royaltyDetails/' + _id, {year: year, data: {comRate: comRate}}, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    url = window.location.hash;

                    Backbone.history.fragment = '';
                    Backbone.history.navigate(url, {trigger: true});
                });
            }else{
                return App.render({
                    type   : 'error',
                    message: message
                });
            }
        },

        hideDialog: function () {
            $('.create-dialog').remove();
        },

        render: function () {
            var self = this;
            var formString = this.template({
            	model : this.model
            });

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'create-dialog',
                width      : '500px',
                buttons    : [
                    {
                        text : '保存',
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

    return EditView;
});
