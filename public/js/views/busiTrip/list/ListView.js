define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/busiTrip/list/listHeader.html',
    'views/busiTrip/CreateView',
    'views/busiTrip/EditView',
    'views/busiTrip/list/ListItemView',
    'models/busiTripModel',
    'collections/busiTrip/filterCollection',
    'collections/busiTrip/editCollection',
    'common',
    'dataService',
    'populate',
    'async',
    'constants',
    'helpers/keyCodeHelper'
], function (Backbone, $, _, ListViewBase, listTemplate, CreateView, EditView, ListItemView, currentModel, contentCollection, EditCollection, common, dataService, populate, async, CONSTANTS, keyCodes) {
    'use strict';

    var busiTripListView = ListViewBase.extend({
        contentType  : CONSTANTS.BUSITRIP,
        viewType     : 'list',
        responseObj  : {},
        hasPagination: true,
        listTemplate : listTemplate,
        ListItemView : ListItemView,
        changedModels: {},

        initialize: function (options) {
            $(document).off('click');

            this.CreateView = CreateView;
            this.currentModel = currentModel;

            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.sort = options.sort;
            this.filter = options.filter;
            this.page = options.collection.currentPage;
            this.contentCollection = contentCollection;

            this.render();
        },

        events: {
            'click .list tbody td:not(.notForm, .validated)'   : 'goToEditDialog',
        },


        editRow: function (e) {
            var el = $(e.target);
            var tr = $(e.target).closest('tr');
            var Ids = tr.data('id');
            var colContent = el.data('content');
            var isApproved = (colContent === 'isApproved');
            var isPaid = (colContent === 'isPaid');
            var self = this;
            var isName = false;
            var prevValue;
            var width;
            var ul;
            var editedElement;

            $('.newSelectList').remove();

            if (el.attr('data-content') === 'name') {
                isName = true;
            }

            if (Ids && el.prop('tagName') !== 'INPUT') {
                if (this.Ids) {
                    editedElement = this.$listTable.find('.editing');
                    this.setChangedValueToModel();
                }
                this.modelId = Ids;
                this.setChangedValueToModel();
            }

            if (isApproved) {
                ul = "<ul class='newSelectList'>" + "<li data-id='true'>是</li>" + "<li data-id='false'>否</li>" ;
                el.append(ul);
            } else if (isPaid) {
                ul = "<ul class='newSelectList'>" + "<li data-id='true'>是</li>" + "<li data-id='false'>否</li>";
                el.append(ul);
            } else {
                prevValue = el.text();
                width = el.width() - 6;
                el.html('<input class="editing" type="text" value="' + prevValue + '"   style="width:' + width + 'px">');
                if (!isName) {
                    el.find('input').attr('maxlength', '6');
                }

                el.find('.editing').keydown(function (event) {
                    var code = event.keyCode;

                    if (keyCodes.isEnter(code)) {
                        self.setChangedValueToModel();
                    } else if (!isName && !keyCodes.isDigit(code) && !keyCodes.isBspaceAndDelete(code) && !keyCodes.isDecimalDot(code)) {
                        event.preventDefault();
                    }
                });
            }

            return false;
        },

        deleteItems: function () {
            var self = this;
            var $thisEl = this.$el;
            var $table = $thisEl.find('#listTable');
            var collection = this.collection;
            var url = collection.url;
            console.log(url);
            var $checkedInputs;
            var ids = [];
            var answer;

            answer = confirm('真的要删除吗 ?!');

            if (answer === false) {
                return false;
            }

            $checkedInputs = $table.find('input:checked');

            $.each($checkedInputs, function () {
                var $el = $(this);

                ids.push($el.val());
            });

            ids = _.compact(ids);

            dataService.patchData(url, {contentType: this.contentType, ids: ids}, function (err, response) {
                if (err) {
                    return App.render({
                        type   : 'error',
                        message: '不能删除'
                    });
                }
                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true});
            });
        },

        bindingEventsToEditedCollection: function (context) {
            if (context.editCollection) {
                context.editCollection.unbind();
            }

            context.editCollection = new EditCollection(context.collection.toJSON());
            context.editCollection.on('saved', context.savedNewModel, context);
            context.editCollection.on('updated', context.updatedOptions, context);
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var targetElement = target.parents('td');
            var tr = target.parents('tr');
            var modelId = tr.data('id');
            var id = targetElement.attr('id');
            var model = this.collection.get(modelId);
            var changedAttr;
            var datacontent;

            this.setEditable(targetElement);

            if (!this.changedModels[modelId]) {
                if (!model.id) {
                    this.changedModels[modelId] = model.attributes;
                } else {
                    this.changedModels[modelId] = {};
                }
            }

            targetElement.text(target.text());
            targetElement.removeClass('errorContent');

            changedAttr = this.changedModels[modelId];
            targetElement.attr('data-id', id);

            if (targetElement.attr('data-content') === 'isApproved') {
                datacontent = 'isApproved';
            } else {
                datacontent = 'isPaid';
            }

            changedAttr[datacontent] = target.text();

            this.hide(e);
            this.setEditable(targetElement);

            return false;
        },

        goToEditDialog: function(e){
            var id = $(e.target).closest('tr').data('id');
            var model = this.collection.get(id);
            var self = this;
            e.preventDefault();
            var status = model.attributes.status;
            console.log(status);
            if(status == 0){
                return new EditView({
                  model : model});
            }
            else{
                return App.render({
                        type   : 'error',
                        message: '正在审批中不能编辑'
                    });
            }
        },
        

        render: function () {
            var self = this;
            var $currentEl = this.$el;

            $('.ui-dialog ').remove();

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.numberToShow
            }).render()); // added two parameters page and items number

            // this.renderPagination(this.$el);

            setTimeout(function () {
                self.editCollection = new EditCollection(self.collection.toJSON());
                self.editCollection.on('saved', self.savedNewModel, self);
                self.editCollection.on('updated', self.updatedOptions, self);

                self.$listTable = $('#listTable');
            }, 10);

            return this;
        }
    });

    return busiTripListView;
});

