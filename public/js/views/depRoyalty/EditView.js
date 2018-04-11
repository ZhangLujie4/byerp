/**
 * Created by wmt on 2017/7/27.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/depRoyalty/EditTemplate.html',
    'models/depRoyaltyModel',
    'views/dialogViewBase',
    'common',
    'custom',
    'populate',
    'constants',
    'helpers'
], function (Backbone, $, _, EditTemplate, Model, dialogViewBase, common, Custom, populate, CONSTANTS, helpers) {

    var CreateView = dialogViewBase.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.DEPROYALTY,
        template   : _.template(EditTemplate),
        events     : {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.model = options.model;
            this.responseObj = {};
            this.render();
        },

        saveItem: function (e) {
        	var model = this.model.toJSON();
            var year = this.model.toJSON().year;
            var basePay = parseInt(this.$el.find('#basePay').val());
            var guaSalary = parseInt(this.$el.find('#guaSalary').val());
            var description = this.$el.find('#description').val();
            var wBonuses = parseInt(((model.effecAtten/model.ratedAtten)*basePay+model.commission).toFixed(2));
            if(wBonuses < guaSalary){
            	wBounses = (model.effecAtten/model.ratedAtten)*guaSalary;
            }

            if(basePay==0 || guaSalary==0){
                return App.render({
                    type   : 'error',
                    message: '基本工资和保底年薪不可为空！'
                });
            }else{
	            this.model.save(
		            {
		                basePay     : basePay,
		                guaSalary   : guaSalary,
		                wBonuses    : wBonuses,
		                description : description,
                        year        : year
		            }, {
		                patch  : true,
		                success: function () {
		                    url = window.location.hash;

		                    Backbone.history.fragment = '';
		                    Backbone.history.navigate(url, {trigger: true});
		                },

		                error: function (model, xhr) {
		                    self.errorNotification(xhr);
		                }
            	});
            }
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
        },

        render: function () {
            var self = this;
            var formString = this.template({
                model : this.model.toJSON()
            });

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'edit-dialog',
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
