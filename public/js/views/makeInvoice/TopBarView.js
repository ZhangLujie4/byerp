define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/makeInvoice/TopBarTemplate.html',
    'views/selectView/selectView',
    'views/makeInvoice/CreateView'
], function (_, BaseView, ContentTopBarTemplate,SelectView,CreateView) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'makeInvoice',
        template   : _.template(ContentTopBarTemplate),

        events: {
            'click .editable'                                             : 'showNewSelect',
            'click .stageSelectType'                                      : 'showNewSelectType',
            'click .newSelectList li'                                     : 'chooseOption',
            'click .newSelectList li:not(.miniStylePagination)'           : 'changeType',
            'click  #top-bar-createBtn'                                   : 'create'
        },

        showNewSelect: function (e) {
            var models;
            var $target = $(e.target);

            models=[
                {
                    _id : 'addValueTaxInvoice',
                    name: '增值税开票'
                }, {
                    _id : 'makeInvoice',
                    name: '工程开票'
                }, {
                    _id : 'designInvoice',
                    name: '设计开票'
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
            var self = this;
            var redirectUrl;

            if (tempClass && tempClass === 'fired') {
                target.closest('.editable').addClass('fired');
            } else {
                target.closest('.editable').removeClass('fired');
            }
            targetElement.text(target.text());
            if (target.length) {
                this.Type = target.attr('id');
            } else {
                this.$el.find('.editable').find('span').text(self.Type ? self.Type.name : '111Select');
                this.$el.find('.editable').attr('data-id', self.Type ? self.Type._id : null);
            }

            if(this.Type=='makeInvoice'){
                redirectUrl = '#easyErp/makeInvoice/list';
                Backbone.history.navigate(redirectUrl, {trigger: true});
            }
            if(this.Type=='addValueTaxInvoice'){
                redirectUrl = '#easyErp/addValueTaxInvoice/list';
                Backbone.history.navigate(redirectUrl, {trigger: true});
            }
            if(this.Type=='designInvoice'){
                redirectUrl = '#easyErp/designInvoice/list';
                Backbone.history.navigate(redirectUrl, {trigger: true});
            }

        },

        create:function (e) {
            e.preventDefault();
            return new CreateView();
        }
    });

    return TopBarView;
});
