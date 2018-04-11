define([
    'jQuery',
    'Underscore',
    'text!templates/marketSettings/list/ListHeader.html',
    'views/marketSettings/list/ListItemView',
    'views/listViewBase',
    'views/marketSettings/CreateView',
    'collections/marketSettings/filterCollection',
    'dataService'
], function ($, _,
             ListHeader,
             ListItemView,
             ListViewBase,
             CreateView,
             ContentCollection,
             dataService
    ) {
    var ListView = ListViewBase.extend({
        ListHeader       : ListHeader,
        ListItemView     : ListItemView,
        contentType      : 'marketSettings',
        contentCollection : ContentCollection,
        hasPagination    : true,

        initialize: function (options) {

            this.collection = options.collection;
            this.filter = options.filter;
            this.startTime = options.startTime;
            this.page = options.collection.currentPage;
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.contentCollection = ContentCollection;

            ListViewBase.prototype.initialize.call(this, options);
        },

        crawlerAluminum: function(){
            var self = this;
            var $thisEl = this.$el;
            var $table = $thisEl.find('#listTable');
            var collection = this.collection.toJSON();
            var url = collection.url;
            var $checkedInputs;
            var _ids = [];
            var ids = [];
            $checkedInputs = $table.find('input:checked');
            $.each($checkedInputs, function () {
                var $el = $(this);
                _ids.push($el.val());
            });
            var result = [];
            ids = _.compact(_ids);

            if(ids.length){
                dataService.getData( 'marketSettings/crawler', {ids : ids}, function (response) {
                    if(response){
                        App.render({
                            type   : 'notify',
                            message: '已成功爬取数据！'
                        });
                    }
                },this);
            }else{
                App.render({
                    type   : 'error',
                    message: '请选择市场类型！'
                });
            }

        },

        createItem: function () {
            return new CreateView({
                collection : this.collection
            });
        },

        render: function () {
            var $currentEl = this.$el;

            $('.ui-dialog ').remove();

            $currentEl.html('');
            $currentEl.append(_.template(ListHeader));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render());
        }
    });

    return ListView;
});
