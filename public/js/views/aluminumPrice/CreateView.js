define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/aluminumPrice/CreateTemplate.html',
    'models/aluminumPriceModel',
    'views/dialogViewBase',
    'common',
    'custom',
    'populate',
    'constants',
    'dataService'
], function (Backbone, $, _, CreateTemplate, Model, dialogViewBase, common, Custom, populate, CONSTANTS, dataService) {

    var CreateView = dialogViewBase.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.ALUMINUMPRICE,
        template   : _.template(CreateTemplate),
        events     : {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.collection = options.collection;
            this.model = new Model();
            this.responseObj = {};
            this.render();
        },

        saveItem: function (e) {
            var thisEl = this.$el;
            var self = this;
            var dayTime = $.trim(thisEl.find('#dayTime').val());
            var classId = $.trim(thisEl.find('#classId').val());
            var minPrice = $.trim(thisEl.find('#minPrice').val());
            var maxPrice = $.trim(thisEl.find('#maxPrice').val());
            var yAverage = $.trim(thisEl.find('#yAverage').val());
            var average = $.trim(thisEl.find('#average').val());
            var url;
            var isDo = true;
            var isHas = false;
            var model;
            var collection = this.collection.toJSON();

            for(var i=0; i<collection.length; i++){
                if(collection[i].classId === parseInt(classId) && collection[i].dayTime === dayTime){
                    isDo = false;
                }
            }

            dataService.getData('/marketSettings/', {}, function (results) {
                var markets = results.data;
                for(var i=0; i<markets.length; i++){
                    if(parseInt(classId) === markets[i].classId){
                        isHas = true;
                    }
                }

                if(dayTime === "" || classId === "" || minPrice === "" || maxPrice === "" || yAverage === "" || average === ""){
                    App.render({
                        type   : 'error',
                        message: '请将信息填写完整！'
                    });
                }else if(isDo && isHas){

                    model = {
                        classId : parseInt(classId),
                        minPrice : parseInt(minPrice),
                        maxPrice : parseInt(maxPrice),
                        yAverage : parseInt(yAverage),
                        average : parseInt(average),
                        move : parseInt(average) - parseInt(yAverage),
                        isCrawler : false,
                        dayTime : dayTime
                    };

                    dataService.postData('/aluminumPrice/', model, function(err, results){
                        if(err){
                            App.render({
                                type   : 'error',
                                message: '新建失败！'
                            });
                        }else{
                            url = window.location.hash;

                            Backbone.history.fragment = '';
                            Backbone.history.navigate(url, {trigger: true});
                        }
                    });
                }else if(isHas){
                    App.render({
                        type   : 'error',
                        message: '该类别的铝锭价格已存在！'
                    });
                }else {
                    App.render({
                        type   : 'error',
                        message: '暂无该类别的市场，请先增加对应的市场类别！'
                    });          
                }

            });
        },

        hideDialog: function () {
            $('.create-dialog').remove();
        },

        hideNewSelect: function (e) {
            $('.newSelectList').hide();
        },

        showNewSelect: function (e, prev, next) {
            populate.showSelect(e, prev, next, this);
            return false;
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id')).attr('data-level', $target.data('level')).attr('data-fullname', $target.data('fullname'));
        },

        render: function () {
            var self = this;
            var formString = this.template({});

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'create-dialog',
                width      : '400px',
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

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;
});
