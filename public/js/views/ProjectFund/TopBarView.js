define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/ProjectFund/TopBarTemplate.html',
    'constants',
    'views/selectView/selectView'
], function (_, BaseView, ContentTopBarTemplate, CONSTANTS,SelectView) {
    'use strict';

    var TopBarView = BaseView.extend({
        el         : '#top-bar',
        contentType: CONSTANTS.PROJECTFUND,
        template   : _.template(ContentTopBarTemplate),

        events:{
            'click .editable'                                             : 'showNewSelect',
            'click .newSelectList li:not(.miniStylePagination)'           : 'changeType',
            click                                                         : 'removeInputs'
        },

        removeInputs: function () {

            if (this.selectView) {
                this.selectView.remove();
            }
        },

        showNewSelect: function (e) {
            var modelsForNewSelect;
            var $target = $(e.target);

            e.stopPropagation();
            modelsForNewSelect = [
                {name:'公司项目',_id:'GSXM'},{name:'挂靠项目',_id:'GKXM'}
            ];

            if ($target.attr('id') === 'selectInput') {
                return false;
            }

            if (this.selectView) {
                this.selectView.remove();
            }
            this.selectView = new SelectView({
                e          : e,
                responseObj: {'#type': modelsForNewSelect}
            });

            $target.append(this.selectView.render().el);
        },

        changeType: function (e) {
            var target = $(e.target);
            var targetElement = target.closest('.editable').find('span');
            var tempClass = target.attr('class');

            if (tempClass && tempClass === 'fired') {
                target.closest('.editable').addClass('fired');
            } else {
                target.closest('.editable').removeClass('fired');
            }
            var typeId = target.attr('id');
            targetElement.text(target.text());
            targetElement.attr('data-id', typeId);
            this.trigger('changeDateRange');

        }
    });



    return TopBarView;
});
