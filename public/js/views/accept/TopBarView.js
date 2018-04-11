define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/accept/TopBarTemplate.html',
    'views/selectView/selectView'
], function (_, BaseView, ContentTopBarTemplate,SelectView) {
    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: 'accept',
        template   : _.template(ContentTopBarTemplate),

        events: {
            'click .editable'                                             : 'showNewSelect',
            'click .stageSelectType'                                      : 'showNewSelectType',
            'click .newSelectList li'                                     : 'chooseOption',
            'click .newSelectList li:not(.miniStylePagination)'           : 'changeType',
            click                                                         : 'removeInputs'
        },

        showNewSelect: function (e) {
            var models;
            var $target = $(e.target);

            models=[
                {
                    _id : 'company' ,
                    name: '公司自开'
                }, {
                    _id : 'project',
                    name: '项目部交入'
                }, {
                    _id : 'buy',
                    name: '买入'
                }
            ];
            e.stopPropagation();

            if (this.selectView) {
                this.selectView.remove();
            }

            this.selectView = new SelectView({
                e          : e,
                responseObj: {'#acceptType': models}
            });

            $target.append(this.selectView.render().el);
            return false;
        },

        removeInputs: function () {

            if (this.selectView) {
                this.selectView.remove();
            }
        },

        changeType: function (e) {

            var target = $(e.target);
            var targetElement = target.closest('.editable').find('span');
            var tempClass = target.attr('class');
            var self = this;
            //var redirectUrl;

            if (tempClass && tempClass === 'fired') {
                target.closest('.editable').addClass('fired');
            } else {
                target.closest('.editable').removeClass('fired');
            }
            targetElement.text(target.text());
            if (target.length) {
                this.Type = target.attr('id');  // changed for getting value from selectView dd
            }
            targetElement.attr('data-id', this.Type);
            this.trigger('changeDateRange');

            //redirectUrl = '#easyErp/accept/list/'+this.Type;
           // Backbone.history.navigate(redirectUrl, {trigger: true});


        }
    });

    return TopBarView;
});
