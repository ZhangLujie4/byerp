define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/busiTripApprove/approveTemplate.html',
    'populate',
    'constants',
    'helpers',
    'moment'
], function (Backbone, $, _, ParentView, EditTemplate, populate ,CONSTANTS ,helpers, moment) {
    'use strict';

    var ApproveView = ParentView.extend({
        contentType: "busiTripApprove",
        template   : _.template(EditTemplate),
        responseObj :{},
        events: {
        },

        initialize: function (options) {
            this.currentModel = options.model || options.collection.getElement();
            this.currentModel.urlRoot = '/busiTripApprove';
            this.responseObj['#approve'] = [
                {
                    _id : 'true',
                    name: '同意'
                },
                {
                    _id : 'false',
                    name: '不同意'
                }
            ];
            this.redirect = options.redirect;
            if (options.collection) {
                this.collection = options.collection;
            }

            this.render();
        },

         hideDialog: function () {
            $('.edit-busiTrip-dialog').remove();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));

            if($target.attr('id') == 'false'){
                
                $('#reason-dl').css("display","block");
            }
            else{
                $('#reason-dl').css("display","none");
            }
        },

        saveItem: function(){
            var self = this;
            var mid = 39;
            var status = this.$el.find('#status').data('id');
            var reason = $.trim(this.$el.find('#reason').val());
            var data;
            var isApproved = this.$el.find('#isApproved').attr('data-id');
            var name = $.trim(this.$el.find('#employeesDd').data('id'));
            var agree = this.$el.find('#approve').attr('data-id');
            var isafter = this.$el.find('#isafter').attr('data-id');

            data = {
                    name       : name,
                    status     : status,
                    agree      : agree,
                    reason     : reason,
                    isafter    : isafter,
                    isApproved : isApproved
                };
            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                wait   : true,
                patch  : true,
                success: function () {
                    self.hideDialog();
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },
        
        render: function () {
            var self = this;
            var formString;
            var buttons;
            var model = this.currentModel.toJSON();

            this.$el.delegate(function(events){
                event.stopPropagation();
                event.preventDefault();
            });

            formString = this.template({
                model           : model,
            });
            
            buttons = [
                {
                    text : '确定',
                    class: 'btn blue',
                    click: function () {
                        self.saveItem();
                    }
                },
                {
                    text : '取消',
                    class: 'btn',
                    click: function () {
                        self.hideDialog();
                    }
                }
            ];

            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-busiTrip-dialog',
                title        : 'Edit busiTrip',
                width        : self.isWtrack ? '1200' : '900',
                position     : {my: 'center bottom', at: 'center', of: window},
                buttons      : buttons

            });


            return this;
        }

    });

    return ApproveView;
});
