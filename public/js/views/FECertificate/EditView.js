define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/dialogViewBase',
    'text!templates/FECertificate/EditTemplate.html',
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

            this.currentModel.urlRoot = CONSTANTS.URLS.FECERTIFICATE;
            this.render();
        },

        chooseOption: function (e) {
            var holder = $(e.target).parents('._modalSelect').find('.current-selected');
            holder.text($(e.target).text()).attr('data-id', $(e.target).attr('id'));
            if (holder.attr('id') === 'projectDd') {
                this.selectProject($(e.target).attr('id'));
            }

        },

        selectProject: function (id) {

            if (id !== '') {
                dataService.getData( CONSTANTS.URLS.PROJECTS_GET_FOR_WTRACK, {
                    _id: id
                }, function (response, context) {
                    var project = response;
                    if (project) {
                        var pro=project.data[0];
                        context.$el.find('#pmrDd').val(pro.pmr.name.first+' '+pro.pmr.name.last);
                        context.$el.find('#pmrId').val(pro.pmr._id);
                    }
                }, this);
            } else {
                this.$el.find('#descriptions').val('');
            }

        },

        saveItem: function (event) {
            var self = this;

            var mid;
            var data;
            event.preventDefault();
            mid = 39;


            var projectName = $.trim(this.$el.find('#projectDd').text());
            var pmrName = $.trim(this.$el.find('#pmr').val());
            var makeDate = $.trim(this.$el.find('#makeDate').val());
            var amount = $.trim(this.$el.find('#amount').val());
            var pmr = $.trim(this.$el.find('#pmrId').val());
            var number = $.trim(this.$el.find('#number').val());
            var logoutDate = $.trim(this.$el.find('#logoutDate').val());
            var endDate = $.trim(this.$el.find('#endDate').val());

            data = {
                amount:amount,
                makeDate:makeDate,
                number:number,
                endDate:endDate,
                logoutDate:logoutDate
            };


            this.currentModel.save(data, {
                headers: {
                    mid: mid
                },
                patch  : true,
                success: function (model, res) {
                    self.hideDialog();
                    model = model.toJSON();
                    var $trHolder;
                    $trHolder = $("tr[data-id='" + model._id + "'] td");
                    $trHolder.eq(2).text(makeDate);
                    $trHolder.eq(3).text(endDate );


                    $trHolder.eq(6).text(amount);
                    $trHolder.eq(7).text(number);
                    $trHolder.eq(8).text(logoutDate);

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
            model.makeDate=moment(model.makeDate).format('YYYY-MM-DD');
            model.logoutDate=moment(model.logoutDate).format('YYYY-MM-DD');
            model.endDate=moment(model.endDate).format('YYYY-MM-DD');
            console.log(model)
            var formString = this.template({
                model:model
            });

            var self = this;

            this.$el = $(formString).dialog({
                    dialogClass: 'edit-dialog  task-edit-dialog',
                    width: 800,
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

            populate.get('#projectDd', '/projects/getForDd', {}, 'name', this, false, false);

            this.$el.find('#makeDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'],
                maxDate    : 0
            });

            this.$el.find('#endDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });

            this.$el.find('#logoutDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六']
            });

            this.delegateEvents(this.events);


            return this;
        }

    });
    return EditView;
});
