define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/taxCategories/EditTemplate.html',
    'views/selectView/selectView',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'common',
    'populate',
    'custom',
    'constants',
    'dataService',
    'moment'
], function (Backbone,
             _,
             $,
             ParentView,
             EditTemplate,
             selectView,
             NoteView,
             AttachView,
             common,
             populate,
             custom,
             CONSTANTS,
             dataService,
             moment) {

    var EditView = ParentView.extend({
        contentType: 'Accept',
        template   : _.template(EditTemplate),
        responseObj: {},

        events: {

        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'saveItem', 'deleteItem');

            this.currentModel = (options.model) ? options.model : options.collection.getElement();
            this.currentModel.urlRoot = CONSTANTS.URLS.TAXCATEGORIES;
            this.responseObj = {};
            var self=this;

            dataService.getData(CONSTANTS.URLS.TAXCATEGORIES_GETFORDD,{
            },function (response) {
                self.responseObj['#gist'] = response;
            });
            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            $target.parents('dd').find('.current-selected').text($target.text()).attr('data-id', $target.attr('id'));
        },

        saveItem: function (event) {
            var self = this;

            var mid;
            var data;
            event.preventDefault();
            mid = 39;


            var name = $.trim(this.$el.find('#name').val());
            var sequence = $.trim(this.$el.find('#sequence').val());
            var rate = $.trim(this.$el.find('#rate').val());
            var gist = $.trim(this.$el.find('#gist').data('id')) || null;
            var type = $.trim(this.$el.find("[name='state']:checked").attr('data-value'));
            var project = $.trim(this.$el.find("[name='project']:checked").attr('data-value'));
            if(project){
                gist=null;
            }
            data = {
                name:name,
                sequence:sequence,
                rate:rate,
                gist:gist,
                type:type
            };

            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                patch  : true,
                success: function (model, res) {
                    self.hideDialog();
                    var url = window.location.hash;

                    Backbone.history.fragment = '';

                    Backbone.history.navigate(url, {trigger: true});

                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        deleteItem: function (event) {
            var mid;
            var self = this;
            var answer;

            event.preventDefault();

            mid=39;

            answer = confirm('Really DELETE items ?!');

            if (answer === true) {
                this.currentModel.destroy({
                    headers: {
                        mid: mid
                    },
                    success: function (model) {

                        model = model.toJSON();

                        $("tr[data-id='" + model._id + "'] td").remove();
                        var url = window.location.hash;

                        Backbone.history.fragment = '';

                        Backbone.history.navigate(url, {trigger: true});

                        self.hideDialog();
                    },

                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            }
        },

        render: function () {
            var model=this.currentModel.toJSON();

            var formString = this.template({
                model:model
            });

            var self = this;

            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog  task-edit-dialog',
                width: 400,
                buttons: {
                    save: {
                        text: '保存',
                        class: 'btn blue',
                        click: self.saveItem
                    },
                    cancel: {
                        text: '取消',
                        class: 'btn',
                        click: self.hideDialog
                    },
                    delete: {
                        text: '删除',
                        class: 'btn',
                        click: self.deleteItem
                    }
                }
            });

            this.delegateEvents(this.events);

            return this;
        }

    });
    return EditView;
});
