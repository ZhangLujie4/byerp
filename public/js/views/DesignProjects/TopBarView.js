define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/DesignProjects/TopBarTemplate.html',
    'views/DesignProjects/CreateView'
], function (_, BaseView, ContentTopBarTemplate,CreateView) {
    var TopBarView = BaseView.extend({
        contentType: 'DesignProjects',
        actionType : null, // Content, Edit, Create
        template   : _.template(ContentTopBarTemplate),

        events:{
            //'click #createOutAndDepartmentProject'                     : 'createOutAndDepartment',
            'click #createInAndRecordProject'                          : 'createInAndRecord'
        },

        /*createOutAndDepartment:function () {
            new CreateView({type:'createOutAndDepartment'})
        },*/
        createInAndRecord:function () {
            new CreateView({type:'createInAndRecord'})
        }
    });

    return TopBarView;
});
