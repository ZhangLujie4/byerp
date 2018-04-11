define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/settingsProduct/list/ListHeader.html',
    'views/settingsProduct/CreateView',
    'models/Category',
    'views/settingsProduct/EditView'
], function (Backbone, $, _, ListTemplate, CreateView, CurrentModel, EditView) {
    var DepartmentsListView = Backbone.View.extend({
        el: '#content-holder',

        events: {
            'click #showMore'        : 'showMore',
            'click .checkbox'        : 'checked',
            'click #groupList li'    : 'editItem',
            'click #groupList .edit' : 'editItem',
            'click #groupList .trash': 'deleteItem'
        },

        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.collection.bind('reset', _.bind(this.render, this));
            this.startNumber = 0;
            this.render();
        },

        createDepartmentListRow: function (department, index, className) {
            var disabled = department.name === 'All' ? ' disabled' : '';

            return ('<li class="' + className + disabled + '" data-id="' + department._id + '" data-level="' + department.nestingLevel + '" data-sequence="' + department.sequence + '"><span class="content"><span class="dotted-line"></span><span class="text">' + department.name + '<span title="Delete" class="trash icon">1</span><span title="Edit" class="edit icon">e</span></span></span></li>');
        },

        editItem: function (e) {
            var self = this;
            var model = new CurrentModel({validate: false});
            var id = $(e.target).closest('li').data('id');

            model.urlRoot = '/category/' + id;
            model.fetch({
                success: function (model) {
                    new EditView({myModel: model});
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
            var myModel = this.collection.get($(e.target).closest('li').data('id'));
            var mid = 39;
            var self = this;
            var answer = confirm('确定要删除吗 ?!');

            e.preventDefault();

            if (answer === true) {
                myModel.destroy({
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function () {
                        self.render();
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

        groupMove: function () {
            $('#groupList li').each(function () {
                if ($(this).find('li').length > 0) {
                    $(this).attr('class', 'parent');
                } else {
                    $(this).attr('class', 'child');
                }
            });
        },

        showMore: function () {
            _.bind(this.collection.showMore, this.collection);
            this.collection.showMore({count: 100});
        },
        
        showMoreContent: function (newModels) {
            new ListItemView({collection: newModels, startNumber: this.startNumber}).render();
            this.startNumber += newModels.length;
        },

        createItem: function () {
            new CreateView();
        },

        checked: function () {
            if (this.collection.length > 0) {
                if ($('input.checkbox:checked').length > 0) {
                    $('#top-bar-deleteBtn').show();
                } else {
                    $('#top-bar-deleteBtn').hide();
                    $('#checkAll').prop('checked', false);
                }
            }
        },

        deleteItems: function () {
            var that = this;
            var mid = 39;
            var model;
            
            $.each($('tbody input:checked'), function (index, checkbox) {
                model = that.collection.get(checkbox.value);
                model.destroy({
                    headers: {
                        mid: mid
                    }
                });
            });
            this.collection.trigger('reset');
        },

        render: function () {
            var departments = this.collection.toJSON();
            var self = this;
            var par;
            var model;
            var sequence;
            var nestingLevel;
            
            $('.ui-dialog ').remove();

            this.$el.html(_.template(ListTemplate));
            
            departments.forEach(function (elm, i) {
                if (!elm.parent) {
                    self.$el.find('#groupList').append(self.createDepartmentListRow(elm, i + 1, 'child'));
                } else {
                    par = self.$el.find("[data-id='" + elm.parent._id + "']").removeClass('child').addClass('parent');
                    
                    if (par.children('ul').length === 0) {
                        par.append("<ul style='margin-left:20px'></ul>");
                    }
                    
                    par.children('ul').append(self.createDepartmentListRow(elm, i + 1, 'child'));
                }
            });
            
            this.$el.find('ul').sortable({
                connectWith: 'ul',
                containment: 'document',
                stop       : function (event, ui) {
                    self.groupMove();
                    model = self.collection.get(ui.item.attr('data-id'));
                    sequence = 0;
                    nestingLevel = 0;
                    
                    if (ui.item.next().hasClass('parent') || ui.item.next().hasClass('child')) {
                        sequence = parseInt(ui.item.next().attr('data-sequence'), 10) + 1;
                    }
                    
                    if (ui.item.parents('li').length > 0) {
                        nestingLevel = parseInt(ui.item.parents('li').attr('data-level'), 10) + 1;
                    }
                    
                    model.set({
                        parentCategoryStart: model.toJSON().parent ? model.toJSON().parent._id : null,
                        sequenceStart      : parseInt(ui.item.attr('data-sequence'), 10),
                        parent             : ui.item.parents('li').attr('data-id') ? ui.item.parents('li').attr('data-id') : null,
                        nestingLevel       : nestingLevel,
                        sequence           : sequence
                    });
                    model.save();
                    ui.item.attr('data-sequence', sequence);
                }
            });
            
            $('#checkAll').click(function () {
                $(':checkbox').prop('checked', this.checked);
                
                if ($('input.checkbox:checked').length > 0) {
                    $('#top-bar-deleteBtn').show();
                } else {
                    $('#top-bar-deleteBtn').hide();
                }
            });

            this.$el.append('<div id="timeRecivingDataFromServer">用时 ' + (new Date() - this.startTime) + ' ms</div>');
        }
    });
    return DepartmentsListView;
});
