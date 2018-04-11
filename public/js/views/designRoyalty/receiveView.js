define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/designRoyalty/receive.html',
    'models/designRoyaltyModel',
    'views/dialogViewBase',
    'common',
    'custom',
    'populate',
    'constants',
    'helpers',
    'text!templates/designRoyalty/receivePerson.html',
    'dataService'
], function (Backbone, $, _, CreateTemplate, Model, dialogViewBase, common, Custom, populate, CONSTANTS, helpers,receivePerson,dataService) {

    var CreateView = dialogViewBase.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.DESIGNROYALTY,
        template   : _.template(CreateTemplate),
        events     : {
            'keyup dd[data-name=receive] input'     : 'calculate'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.model = options.model;
            var model=this.model.toJSON();
            this.personModel = model.persons;
            console.log(model)
            this.responseObj = {};
            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            var holder = $target.parents('._newSelectListWrap').find('.current-selected');

            holder.text($target.text()).attr('data-id', $target.attr('id'));
        },

        calculate:function (e) {
            var selectedReceive = this.$el.find('.receiveItem');
            var targetEl;
            var receive=$.trim(this.$el.find('#receive').val());
            for(var i=0;i<selectedReceive.length;i++){

                targetEl = $(selectedReceive[i]);
                var rate=targetEl.find('#rate').val();
                rate=rate/100;
                var royalty=receive*rate;
                royalty=royalty.toFixed(2)
                var royaltys = targetEl.find('.royalty');
                royaltys.text(royalty);
            }
        },

        saveItem: function (e) {
            var self = this;
            var mid;
            var thisEl = this.$el;

            var model=this.model.toJSON();
            var modelId=model._id;

            var royalty={};
            var detail={};
             detail.details=[];
            var selectedPerson = thisEl.find('.receiveItem');
            var selectedLength = selectedPerson.length;
            var targetEl;
            var i;
            for (i = selectedLength - 1; i >= 0; i--) {
                targetEl = $(selectedPerson[i]);
                var id=targetEl.find('#personDd').data('id');
                var amount=targetEl.find('.royalty').text();
                var name=targetEl.find('#personDd').val();
                royalty={
                    personId:id,
                    name :name,
                    amount:amount
                };
                detail.details.push(royalty)
            }
            var receive=$.trim(this.$el.find('#receive').val());

            detail.amount=receive;
            receive=receive*1+model.receive*1;
            var balance=model.amount*1-receive*1;

            var royalties=model.royalties;
            royalties.push(detail);

            this.model.save({
                royalties: royalties,receive:receive,balance:balance
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


            /*dataService.patchData(CONSTANTS.URLS.DESIGNROYALTY_CREATEROYALTY,{
                _id:modelId,detail:detail
            },function (response) {
                var url = window.location.hash;

                Backbone.history.fragment = '';

                Backbone.history.navigate(url, {trigger: true});
            });*/

        },

        hideDialog: function () {
            $('.dialog').remove();
        },

        render: function () {
            var self = this;
            var formString = this.template({model:this.personModel});
            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'dialog',
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

            var $thisEl = this.$el;
            var personContainer;
            personContainer = $thisEl.find('#receiveList');
            personContainer.append(_.template(receivePerson, {
                person        : this.personModel

            }));

            populate.get2name('#personDd', 'employees/getForDd',{},this, false);

            return this;
        }
    });

    return CreateView;
});
