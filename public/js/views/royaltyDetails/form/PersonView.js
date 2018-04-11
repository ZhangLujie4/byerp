/**
 * Created by wmt on 2017/7/26.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/royaltyDetails/form/CreatePersonTemp.html',
    'text!templates/royaltyDetails/form/EditPersonTemp.html',
    'models/royaltyDetailsModel',
    'views/dialogViewBase',
    'common',
    'custom',
    'populate',
    'constants',
    'helpers'
], function (Backbone, $, _, CreateTemplate, EditTemplate, Model, dialogViewBase, common, Custom, populate, CONSTANTS, helpers) {

    var CreateView = dialogViewBase.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.ROYALTYDETAILS,
        template   : _.template(CreateTemplate),
        editTemp   : _.template(EditTemplate),
        events     : {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.model = options.model;
            if(options.person){
                this.personModel = options.person;
            }
            this.responseObj = {};
            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            var holder = $target.parents('._newSelectListWrap').find('.current-selected');

            holder.text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function (e) {
            var self = this;
            var mid;
            var persons = this.model.toJSON().persons;
            var year = this.model.toJSON().year;
            var isDo = true;
            var name = this.$el.find('#personDd').attr('data-id');
            var scale = this.$el.find('#scale').val();
            var deductions = this.$el.find('#deductions').val();
            var person = {};

            if(this.personModel){
                person.name = this.personModel.name._id;
                mid = 1;
            }else{
                person.name = name;
                mid = 2;
                for(var i=0; i<persons.length; i++){
                    if(persons[i].name._id === name){
                        isDo = false;
                    }
                }
            }

            person.scale = scale;
            person.deductions = deductions;

            if(!deductions){
                deductions = 0;
            }

            if(scale){
                if(isDo){
                    this.model.save({
                        data  : person,
                        year  : year
                    }, {
                        headers: {
                            mid: mid
                        },
                        patch  : true,
                        success: function () {
                            var url = window.location.hash;

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
                        message: '该人员已设置提成，请直接修改！'
                    });
                }
            }else{
                return App.render({
                    type   : 'error',
                    message: '提成比例不可为空！'
                });
            }
        },

        hideDialog: function () {
            $('.dialog').remove();
        },

        render: function () {
            var self = this;
            var formString = this.template({});
            if(this.personModel){
                formString = this.editTemp({person: this.personModel});
                this.$el = $(formString).dialog({
                    autoOpen   : true,
                    dialogClass: 'dialog',
                    width      : '300px',
                    buttons    : [
                        {
                            text : '编辑',
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
            }else{
                this.$el = $(formString).dialog({
                    autoOpen   : true,
                    dialogClass: 'dialog',
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
            }

            populate.get2name('#personDd', 'employees/getForDdByDeptId/'+CONSTANTS.BUSINESS_DEPARTMENT_ID,{},this, true);

            return this;
        }
    });

    return CreateView;
});
