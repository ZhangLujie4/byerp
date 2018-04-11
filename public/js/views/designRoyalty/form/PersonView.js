define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/designRoyalty/form/CreatePersonTemp.html',
    'text!templates/designRoyalty/form/EditPersonTemp.html',
    'models/designRoyaltyModel',
    'views/dialogViewBase',
    'common',
    'custom',
    'populate',
    'constants',
    'helpers',
    'text!templates/designRoyalty/person/create.html',
    'text!templates/designRoyalty/person/edit.html'
], function (Backbone, $, _, CreateTemplate, EditTemplate, Model, dialogViewBase, common, Custom, populate, CONSTANTS, helpers,create,edit) {

    var CreateView = dialogViewBase.extend({
        el         : '#content-holder',
        contentType: CONSTANTS.DESIGNROYALTY,
        template   : _.template(CreateTemplate),
        editTemp   : _.template(EditTemplate),
        events     : {
            'click .addItem a'   : 'getItem',
            'click .removeItem'    : 'deleteRow'
        },

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.model = options.model;
            var model=this.model.toJSON();
            this.personModel = model.persons;

            this.responseObj = {};
            this.render();
        },

        chooseOption: function (e) {
            var $target = $(e.target);

            var holder = $target.parents('._newSelectListWrap').find('.current-selected');

            holder.text($target.text()).attr('data-id', $target.attr('id'));
        },

        getItem:function(e){
            var target = $(e.target);
            var $parrent = target.closest('tbody');
            var templ = _.template(create);
            var $trEll = $parrent.find('tr.personItem');
            e.preventDefault();
            e.stopPropagation();
            if(!$trEll.length){
                $parrent.prepend(templ({}));
            }
            $($trEll[$trEll.length - 1]).after(templ({}));
            return false;
        },
        deleteRow: function (e){
            var target = $(e.target);
            var tr = target.closest('tr');
            tr.remove();

        },

        saveItem: function (e) {
            var self = this;
            var mid;
            var thisEl = this.$el;

            var selectedPerson = thisEl.find('.personItem');
            var selectedLength = selectedPerson.length;
            var targetEl;
            var persons=[];
            var i;
            for (i = selectedLength - 1; i >= 0; i--) {
                targetEl = $(selectedPerson[i]);
                var name=targetEl.find('#personDd').data('id');
                var rate=targetEl.find('#rate').val();
                if(!name){
                    return App.render({
                        type   : 'error',
                        message: '人员选择错误！'
                    });
                }
                if(rate<=0){
                    return App.render({
                        type   : 'error',
                        message: '提成比例错误！'
                    });
                }
                persons.push({
                    name      :name,
                    rate           :rate

                });
            }

            this.model.save({
                persons: persons
            }, {
                headers: {
                    mid: mid
                },
                patch  : true,
                success: function () {

                    var url = window.location.hash;

                    Backbone.history.fragment = '';

                    Backbone.history.navigate(url, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });

        },

        hideDialog: function () {
            $('.dialog').remove();
        },

        render: function () {
            var self = this;
            var formString = this.template({model:this.personModel});
                this.$el = $(formString).dialog({
                    autoOpen   : true,
                    dialogClass: 'dialog',
                    width      : '400px',
                    buttons    : [
                        {
                            text : '保存',
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

            var $thisEl = this.$el;
            var personContainer;
            personContainer = $thisEl.find('#personList');
            personContainer.append(_.template(edit, {
                person        : this.personModel

            }));

            populate.get2name('#personDd', 'employees/getForDd',{},this, false);

            return this;
        }
    });

    return CreateView;
});
