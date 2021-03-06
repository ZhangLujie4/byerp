define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/settingsOverview/productDetails/productCategories/ContentTemplate.html',
    'text!templates/settingsOverview/productDetails/productCategories/IndexTemplate.html',
    'models/Category',
    'views/settingsOverview/productDetails/productCategories/CreateView',
    'views/settingsOverview/productDetails/productCategories/EditView',
    'helpers/eventsBinder',
    'dataService',
    'constants'
], function (Backbone, $, _, ContentTemplate, ItemTemplate, CurrentModel, CreateCategoryView, EditCategoryView, ProductsCollection, ThumbnailsView, eventsBinder, dataService, CONSTANTS) {
    var ProductsView = Backbone.View.extend({
        el               : '#productCategoriesTab',
        thumbnailsView   : null,
        productCollection: null,
        itemTemplate     : _.template(ItemTemplate),

        events: {
            'click .expand'           : 'expandHideItem',
            'click .item > .content'  : 'selectCategory',
            'click .editCategory'     : 'editItem',
            'click .deleteCategory'   : 'deleteItem',
            'click .addProduct'       : 'addProduct',
            'click #top-bar-createBtn': 'createItem'
        },

        initialize: function (options) {
            var eventChannel = {};

            _.extend(eventChannel, Backbone.Events);

            this.topBar = options.topBar;
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.eventChannel = eventChannel;
            this.collection.bind('reset add change', this.render, this);
            this.startNumber = 0;
            this.filter = options.filter;
            this.countPerPage = options.countPerPage;

            this.render();
        },

        addProduct: function (event) {
            event.preventDefault();
            this.thumbnailsView.createItemProduct();
        },

        selectFirstCategory: function () {
            var $thisEl = this.$el;

            $thisEl.find('.groupList .selected').removeClass('selected');
            $thisEl.find('.content').first().addClass('selected');
        },

        selectCategory: function (e) {
            var $targetEl = $(e.target);
            var $thisEl = this.$el;
            var $groupList = $thisEl.find('.groupList');
            var $currentLi;
            var id;

            e.stopPropagation();

            $groupList.find('.selected').removeClass('selected');
            $targetEl.closest('.content').addClass('selected');

            $currentLi = $targetEl.closest('li');
            id = $currentLi.attr('data-id');

            this.renderFilteredContent(id);
        },

        createItem: function () {
            var $thisEl = this.$el;
            var $groupList = $thisEl.find('.groupList');
            var $selectedEl = $groupList.find('.selected').length ? $groupList.find('.selected').closest('li') : $groupList.find('li').first();
            var categoryId = $selectedEl.attr('data-id');

            return new CreateCategoryView({
                _id       : categoryId,
                collection: this.collection
            });
        },

        expandHideItem: function (e) {
            var $target = $(e.target);
            var $ulEl = $target.closest('li').find('ul');

            if ($target.hasClass('disclosed')) {
                $ulEl.addClass('hidden');
                $ulEl.closest('li').find('.expand').removeClass('disclosed icon-folder-open3').addClass('icon-folder3');
            } else {
                $ulEl.first().removeClass('hidden');
                $ulEl.closest('li').find('.expand').first().removeClass('icon-folder3').addClass('disclosed icon-folder-open3');
            }
        },

        renderFilteredContent: function (categoryId) {
            var self = this;
            var categoryUrl = '/category/' + categoryId;
            var ids;

            dataService.getData(categoryUrl, {}, function (category) {

                ids = category.child;
                ids.push(categoryId);

                if (!App.filtersObject.filter) {
                    App.filtersObject.filter = {};
                }

                App.filtersObject.filter.productCategory = {
                    key  : 'info.categories',
                    value: ids,
                    type : this.filterType || null
                };

                self.thumbnailsView.showFilteredPage(App.filtersObject.filter);
                self.thumbnailsView.filterView.showFilterIcons(self.filter);
            }, this);
        },

        editItem: function (e) {
            var self = this;
            var model = new CurrentModel({validate: false});
            var id = $(e.target).closest('li').data('id');

            model.urlRoot = '/category/' + id;
            model.fetch({
                success: function (model) {
                    return new EditCategoryView({myModel: model, collection: self.collection});
                },

                error: function () {
                    App.render({
                        type   : 'error',
                        message: '请刷新浏览器'
                    });
                }
            });

            return false;
        },

        deleteItem: function (e) {
            var $targetEl = $(e.target);
            var myModel = this.collection.get($targetEl.closest('li').data('id'));
            var answer = confirm('是否确认删除?!');

            e.preventDefault();

            if (answer === true) {
                myModel.destroy({
                    wait   : true,
                    success: function () {
                        var url = window.location.hash;
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(url, {trigger: true});
                    },

                    error: function (model, err) {
                        if (err.status === 403) {
                            App.render({
                                type   : 'error',
                                message: '您没有权限执行此操作'
                            });
                        } else {
                            Backbone.history.navigate('home', {trigger: true});
                        }
                    }
                });
            }
            return false;
        },

        renderItem: function (product, className, selected) {
            var canDelete = true;

            if (product.child && product.child.length) {
                canDelete = false;
            } else {
                if (product.productsCount > 0) {
                    canDelete = false;
                }
            }

            return this.itemTemplate({
                className: className,
                selected : selected,
                product  : product,
                canDelete: canDelete
            });
        },

        renderFoldersTree: function (products) {
            var self = this;
            var $thisEl = this.$el;
            var par;
            var selected = '';
            var selectedMain = '';
            var currentCategory;

            if (App.filtersObject.filter && App.filtersObject.filter.productCategory && App.filtersObject.filter.productCategory.value.length) {
                currentCategory = App.filtersObject.filter.productCategory.value[App.filtersObject.filter.productCategory.value.length - 1];
            }

            products.forEach(function (product) {

                if (!currentCategory) {
                    selectedMain = 'selected';
                } else {
                    if (currentCategory === product._id) {
                        selected = 'selected';
                    } else {
                        selected = '';
                    }
                }

                if (!product.parent) {
                    $thisEl.find('.groupList').append(self.renderItem(product, 'child', selectedMain));
                } else {
                    par = $thisEl.find("[data-id='" + product.parent._id + "']").removeClass('child').addClass('parent');

                    if (!par.find('.expand').length) {
                        par.append('<a class="expand disclosed icon-folder-open3" href="javascript:;"></a>');
                    }

                    if (par.find('ul').length === 0) {
                        par.append('<ul></ul>');
                    }

                    par.find('ul').first().append(self.renderItem(product, 'child', selected));
                }

            });

            $('.groupList .item .content').droppable({
                accept   : '.product',
                tolerance: 'pointer',
                drop     : function (event, ui) {
                    var $droppable = $(this).closest('li');
                    var $draggable = ui.draggable;
                    var productId = $draggable.attr('id');
                    var categoryId = $droppable.data('id');
                    var changed;
                    var currentModel = self.productCollection.get(productId);

                    if (!currentModel) {
                        currentModel = new CurrentModel({validate: false});

                        currentModel.urlRoot = CONSTANTS.URLS.PRODUCT;

                        currentModel.fetch({
                            data   : {id: productId, viewType: 'form'},
                            success: function (response) {
                                currentModel.set({
                                    'info.category': categoryId
                                });

                                changed = currentModel.changed;

                                currentModel.save(changed, {
                                    patch  : true,
                                    wait   : true,
                                    success: function () {
                                        self.renderFilteredContent(categoryId);
                                    }
                                });

                                $(this).addClass('selected');
                            },

                            error: function () {
                                App.render({
                                    type   : 'error',
                                    message: 'Please refresh browser'
                                });
                            }
                        });
                    } else {
                        currentModel.set({
                            'info.category': categoryId
                        });

                        changed = currentModel.changed;

                        currentModel.save(changed, {
                            patch  : true,
                            wait   : true,
                            success: function () {
                                self.renderFilteredContent(categoryId);
                            }
                        });

                        $(this).addClass('selected');
                    }
                },

                over: function () {
                    var $droppableEl = $(this);
                    var $groupList = self.$el;

                    $groupList.find('.selected').removeClass('selected');
                    $droppableEl.addClass('selected');
                },

                out: function () {
                    $(this).removeClass('selected');
                }
            });
        },

        render: function () {
            var products = this.collection.toJSON();
            this.$el.html(_.template(ContentTemplate));
            this.renderFoldersTree(products);
        }
    });

    return ProductsView;
});
