define([
    'Underscore',
    'views/topBarViewBase',
    'text!templates/marketSettings/TopBarTemplate.html',
    'dataService',
    'constants'
], function (_, BaseView, ContentTopBarTemplate, dataService, CONSTANTS) {
    var TopBarView = BaseView.extend({
        el : '#top-bar',
        contentType: CONSTANTS.MARKETSETTINGS,
        template   : _.template(ContentTopBarTemplate),

        events     : {
                'click #crawlerAluminum' : 'crawlerAluminum',
                'click #autoSettings'    : 'autoSettings'
        },

        crawlerAluminum: function(event) {
            event.preventDefault();
            this.trigger('crawlerAluminum');
        },

        autoSettings: function(event) {
            var auto = $("input[type='checkbox']").is(':checked');
            var mid;

            if(auto){
                dataService.getData('marketSettings/', {}, function(response){
                    if(response.data.length){
                        var autoData = false;
                        for(var i=0; i<response.data.length; i++){
                            if(response.data[i].auto){
                                autoData = true;
                                mid = 1;
                                dataService.getData('marketSettings/autoSettings', {mid : mid}, function(response){
                                    return App.render({
                                        type : 'notify',
                                        message: '已开启！'
                                    });
                                });
                            }
                        }
                        if(!autoData){
                            $("input[type='checkbox']")[0].checked = false;
                            return App.render({
                                type : 'error',
                                message: '暂无需要自动爬取的数据！'
                            });
                        }
                    }else{
                        $("input[type='checkbox']")[0].checked = false;
                        return App.render({
                            type : 'error',
                            message: '暂无市场类型！'
                        });
                    }
                });
            }else{
                mid = 0;
                dataService.getData('marketSettings/autoSettings', {mid : mid}, function(response){
                    return App.render({
                        type : 'notify',
                        message: '已关闭！'
                    });
                });
            }
        }
    });

    return TopBarView;
});
