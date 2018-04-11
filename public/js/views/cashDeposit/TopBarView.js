define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/cashDeposit/TopBarTemplate.html',
    'views/cashDeposit/CreateView',
    'views/selectView/selectView'
], function (_, BaseView, ContentTopBarTemplate,CreateView,SelectView) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'cashDeposit',
        template   : _.template(ContentTopBarTemplate),

        events: {
            'click .editable'                                             : 'showNewSelect',
            'click .stageSelectType'                                      : 'showNewSelectType',
            'click .newSelectList li'                                     : 'chooseOption',
            'click  #creates'                                             : 'creates',
            'click .newSelectList li:not(.miniStylePagination)'           : 'changeType',
            click                                                         : 'removeInputs'
        },

        removeInputs: function () {

            if (this.selectView) {
                this.selectView.remove();
            }
        },

        creates:function (e) {
            e.preventDefault();

            return new CreateView({isReturn:1});
        },

        showNewSelect: function (e) {
            var models;
            var $target = $(e.target);

            models=[
                {
                    _id : 'tender',
                    name: '投标保证金'
                }, {
                    _id : 'salary',
                    name: '民工工资保证金'
                }, {
                    _id : 'deposit',
                    name: '押金'
                }, {
                    _id : 'reputation',
                    name: '信誉保证金'
                }, {
                    _id : 'perform',
                    name: '投标保证金'
                }, {
                    _id : 'quality',
                    name: '质量保证金'
                }, {
                    _id : 'guarantee',
                    name: '保函保证金'
                }, {
                    _id : 'construction',
                    name: '安全文明施工保证金'
                }
            ];
            e.stopPropagation();

            if (this.selectView) {
                this.selectView.remove();
            }

            this.selectView = new SelectView({
                e          : e,
                responseObj: {'#invoiceType': models}
            });

            $target.append(this.selectView.render().el);
            return false;
        },

        changeType: function (e) {

            var target = $(e.target);
            var targetElement = target.closest('.editable').find('span');
            var tempClass = target.attr('class');
            //var self = this;
            //var redirectUrl;

            if (tempClass && tempClass === 'fired') {
                target.closest('.editable').addClass('fired');
            } else {
                target.closest('.editable').removeClass('fired');
            }
            targetElement.text(target.text());
            if (target.length) {
                this.Type = target.attr('id');
            } /*else {
                this.$el.find('.editable').find('span').text(self.Type ? self.Type.name : '111Select');
                this.$el.find('.editable').attr('data-id', self.Type ? self.Type._id : null);
            }*/
            if(this.Type){
                targetElement.attr('data-id', this.Type);
                this.trigger('changeDateRange');
               // redirectUrl = '#easyErp/cashDeposit/list/'+this.Type;
                //Backbone.history.navigate(redirectUrl, {trigger: true});
            }
        },

        initialize: function (options) {
            if (options.collection) {
                this.collection = options.collection;
                this.cashDepositType=this.collection.cashDepositType;
            }

            this.render();
        },

        render: function () {
            var type;

            switch(this.cashDepositType){
                case 'tender':
                    type='投标保证金';
                    break;
                case 'salary':
                    type='民工工资保证金';
                    break;
                case 'deposit':
                    type='押金';
                    break;
                case 'reputation':
                    type='信誉保证金';
                    break;
                case 'perform':
                    type='投标保证金';
                    break;
                case 'quality':
                    type='质量保证金';
                    break;
                case 'guarantee':
                    type='保函保证金';
                    break;
                case 'construction':
                    type='安全文明施工保证金';
                    break;
                default:
                    type='保证金';

            }

            this.$el.html(this.template({
                type:type,
                contentType:'cashDeposit'
                // buildingName:this.currentBuildingName
            }));



            return this;
        }

    });

    return TopBarView;
});
