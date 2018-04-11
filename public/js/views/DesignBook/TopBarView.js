define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/DesignBook/TopBarTemplate.html',
    'views/DesignBook/CreateView'
], function (_, BaseView, ContentTopBarTemplate,CreateView) {
    var TopBarView = BaseView.extend({
        contentType: 'DesignBook',
        actionType : null, // Content, Edit, Create
        template   : _.template(ContentTopBarTemplate),
        events:{
            'click #createOutAndDepartmentProject'                     : 'create'
        },

        create:function () {
            new CreateView({type:'createOutAndDepartment'})
        }
    });

    return TopBarView;
});
