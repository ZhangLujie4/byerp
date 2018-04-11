define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'views/listViewBase',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'text!templates/oemBarcode/UploadTemplate.html',
    'views/dialogViewBase',
    'dataService',
    'models/OemBarcodeModel',
], function (Backbone,
             $,
             _,
             ParentView,
             ListViewBase,
             NoteView,
             AttachView,
             UploadTemplate,
             ParentView,
             dataService,
             OemBarcodeModel) {

    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'oemBarcode',
        template   : _.template(UploadTemplate),

        events: {
            'click #upload-graph-btn' : 'allOpinionUpdate'
        },

        initialize: function (options) {
            _.bindAll(this, 'allOpinionUpdate', 'render');
            if (options) {
                this.visible = options.visible;
            }

            this.currentIds = options.ids;
            this.currentModel = new OemBarcodeModel();
            this.responseObj = {};

            this.render();
        },

        allOpinionUpdate: function () {
            var self = this;
            var $thisEl = this.$el;
            var $table = $thisEl.find('#listTable');
            var collection = this.collection;
            var $checkedInputs;
            var ids = [];
            var answer;
            var edited = this.edited || $thisEl.find('tr.false, #false');
            var handlOpinion = $.trim(this.$el.find('#handlOpinion').val());
            var opinionUrl = window.location.hash.split('/');

            if (!edited.length) { // ToDo refactor
                this.changed = false;
            }

            if (this.changed) {
                return this.cancelChanges();
            }

            answer = confirm('确定处理吗?!');

            if (answer === false) {
                return false;
            }

            dataService.patchData('/oemBarcode/', {contentType: this.contentType, ids: this.currentIds, writeOffsId: opinionUrl[3], handlOpinion: handlOpinion}, function (err, response) {
                if (err) {
                    return App.render({
                        type   : 'error',
                        message: '无法处理!'
                    });
                }

                Backbone.history.fragment = '';
                Backbone.history.navigate(window.location.hash, {trigger: true});
            });
        },

        render: function () {
            var formString = this.template({
                model: this.currentModel.toJSON()
            });

            var self = this;

            this.$el = $(formString).dialog({
                autoOpen   : true,
                dialogClass: 'edit-dialog',
                title      : '批量处理',
                width      : '600px',
                buttons    : {
                    save: {
                        text : '提交',
                        class: 'btn blue',
                        click: self.allOpinionUpdate
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideDialog
                    }
                }

            });


        }

    });

    return CreateView;
});
