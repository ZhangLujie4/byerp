define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/projectApproval/form/FormTemplate.html',
    'text!templates/projectApproval/workflowProgress.html',
    'text!templates/projectApproval/aboutTemplate.html',
    'views/Editor/ApprovalNoteView',
    'views/Editor/AttachView',
    'views/Companies/formPropertyView',
    'views/Persons/formProperty/formPropertyView',
    'views/Tags/TagView',
    'views/followers/index',
    'constants',
    'dataService',
    'views/selectView/selectView',
    'helpers/keyValidator'
], function (Backbone, _, $, OpportunitiesFormTemplate, workflowProgress, aboutTemplate, EditorView, AttachView, CompanyFormProperty, ContactFormProperty, TagView, Followers, constants, dataService, SelectView, keyValidator) {
    'use strict';

    var FormOpportunitiesView = Backbone.View.extend({
        el: '#content-holder',

        initialize: function (options) {
            this.formModel = options.model;
            this.formModel.urlRoot = constants.URLS.OPPORTUNITIES;
            this.formModel.on('change:tags', this.saveTags, this);
            _.bindAll(this, 'saveDeal');
            this.responseObj = {};
            this.modelChanged = {};
        },

        events: {
            click                                              : 'hideNewSelect',
            'click #tabList a'                                 : 'switchTab',
            'keyup .editable'                                  : 'setChangeValueToModel',
            'keypress .dealTitlePrice'                         : 'keypress',
            'click #cancelBtn'                                 : 'cancelChanges',
            'click #saveBtn'                                   : 'saveChanges',
            'click .tabListItem'                               : 'changeWorkflow',
            'click .current-selected:not(.jobs)'               : 'showNewSelect',
            'click .newSelectList li:not(.miniStylePagination)': 'chooseOption'
        },

        hideNewSelect: function () {
            this.$el.find('.newSelectList').hide();

            if (this.selectView) {
                this.selectView.remove();
            }
        },
        showEdit     : function () {
            this.$el.find('.upload').animate({
                height : '20px',
                display: 'block'
            }, 250);

        },

        keypress: function (e) {
            return keyValidator(e);
        },

        hideEdit: function () {
            this.$el.find('.upload').animate({
                height : '0px',
                display: 'block'
            }, 250);

        },

        setChangeValueToModel: function (e) {
            var $target = $(e.target);
            var property = $target.attr('data-id').replace('_', '.');
            var value = $target.val();

            if (!value && !$target.hasClass('hideLine')) {
                $target.addClass('hideLine');
            }
            if (value) {
                $target.removeClass('hideLine');
            }

            this.modelChanged[property] = value;
            this.showButtons();
        },

        showButtons: function () {
            this.$el.find('#formBtnBlock').addClass('showButtons');
        },

        hideButtons: function () {
            this.$el.find('#formBtnBlock').removeClass('showButtons');
        },

        saveChanges: function (e) {
            e.preventDefault();
            this.saveDeal(this.modelChanged);
        },

        cancelChanges: function (e) {
            e.preventDefault();
            this.modelChanged = {};
            this.renderAbout();
        },

        showNewSelect: function (e) {
            var $target = $(e.target);

            e.stopPropagation();

            if ($target.attr('id') === 'selectInput') {
                return false;
            }

            if (this.selectView) {
                this.selectView.remove();
            }

            this.selectView = new SelectView({
                e          : e,
                responseObj: this.responseObj
            });

            $target.append(this.selectView.render().el);

            return false;
        },

        changeWorkflow: function (e) {
            var $target = $(e.target);
            var $thisEl = this.$el;
            var wId;
            var $tabs = $thisEl.find('#workflowProgress .tabListItem');

            if (!$target.hasClass('tabListItem')) {
                $target = $target.closest('div');
            }
            wId = $target.find('span').attr('data-id');
            $tabs.removeClass('passed');
            $tabs.removeClass('active');
            $target.prevAll().addClass('passed');
            $target.addClass('active');
            this.saveDeal({workflow: wId});
        },

        chooseOption: function (e) {
            var $target = $(e.target);
            var holder = $target.parents('.inputBox').find('.current-selected');
            var type = $target.closest('a').attr('data-id');
            var text = $target.text();
            var id = $target.attr('id');
            var noOtherDetail = document.getElementById("noOtherDetail");
            var textOther = $.trim($target.text());

            holder.text($target.text());

            this.modelChanged[type] = id;
            this.$el.find('#assignedToDd').text(text).attr('data-id', id);
            this.showButtons();

            var model = this.formModel.toJSON();
            var otherDetail = model.otherDetail;
            if(textOther == '其他'){
                noOtherDetail.innerHTML = 
                "<label>"+"其他明细"+"</label>"
                + "<div class='inputBox'>"
                + "<input class='editable' data-id='otherDetail' value=" + otherDetail + ">"
                + "</div>"
            }
            else{
                noOtherDetail.innerHTML = '';
            }
        },

        saveDeal: function (changedAttrs, type) {
            var $thisEl = this.$el;
            var self = this;
            var changedAttributesForEvent = ['name', 'leadDate.retDate' , 'expectedRevenue.value', 'salesPerson', 'archPerson', 'workflow'];
            var changedListAttr = _.intersection(Object.keys(changedAttrs), changedAttributesForEvent);
            var sendEvent = !!(changedListAttr.length);

            this.formModel.save(changedAttrs, {
                patch  : true,
                success: function () {
                    if (type === 'formProperty') {
                        Backbone.history.fragment = '';
                        Backbone.history.navigate(window.location.hash, {trigger: true});
                    } else if (type === 'tags') {
                        self.renderTags();
                    } else {
                        self.editorView.renderTimeline();
                        self.modelChanged = {};
                        self.hideButtons();

                        if (sendEvent) {

                            if (changedAttrs.hasOwnProperty('salesPerson')) {
                                changedAttrs.salesPerson = $thisEl.find('#salesPersonDd').text().trim();
                            }
                            if (changedAttrs.hasOwnProperty('archPerson')) {
                                changedAttrs.archPerson = $thisEl.find('#archPersonDd').text().trim();
                            }


                            if (changedAttrs.hasOwnProperty('workflow')) {
                                changedAttrs.workflow = $thisEl.find('.tabListItem.active span').text().trim();
                            }

                            self.trigger('itemChanged', changedAttrs);
                        }
                    }
                },

                error: function (model, response) {
                    if (response) {
                        App.render({
                            type   : 'error',
                            message: response.error
                        });
                    }
                }
            });
        },

        saveTags: function () {
            this.saveDeal(this.formModel.changed, 'tags');
        },

        renderTags: function () {
            var notDiv = this.$el.find('.tags-container');
            notDiv.empty();

            notDiv.append(
                new TagView({
                    model      : this.formModel,
                    contentType: 'Opportunities'
                }).render().el
            );
        },

        deleteItems: function () {
            var mid = 39;

            this.formModel.destroy({
                headers: {
                    mid: mid
                },
                success: function () {
                    Backbone.history.navigate('#easyErp/Opportunities/kanban', {trigger: true});
                }
            });

        },

        renderAbout: function () {
            var self = this;
            var $thisEl = this.$el;
            $thisEl.find('.aboutHolder').html(_.template(aboutTemplate, this.formModel.toJSON()));
            this.renderTags();
            $thisEl.find('#expectedClosing').datepicker({
                dateFormat : 'd M, yy',
                changeMonth: true,
                changeYear : true,
                onSelect   : function (dateText) {
                    self.modelChanged['expectedClosing'] = new Date(dateText);
                    self.showButtons();
                }

            });

        },

        render: function () {
            var formModel = this.formModel.toJSON();
            var self = this;
            var $thisEl = this.$el;
            var companyModel;

            $thisEl.html(_.template(OpportunitiesFormTemplate, formModel));

            var noOtherDetail = document.getElementById("noOtherDetail");

            if(formModel.expDepart == '其他'){
                noOtherDetail.innerHTML = 
                "<label>"+"其他明细"+"</label>"
                + "<div class='inputBox'>"
                + "<input class='editable' data-id='otherDetail' value=" + formModel.otherDetail + ">"
                + "</div>"
            }


            dataService.getData('/workflows/', {id: 'Opportunities'}, function (response) {
                self.responseObj = {workflows: response.data};
                $thisEl.find('#workflowProgress').append(_.template(workflowProgress, {
                    workflows: self.responseObj.workflows,
                    workflow : formModel.workflow
                }));
            });

            dataService.getData('/customers', {type: 'Person'}, function (employees) {
                employees = _.map(employees.data, function (employee) {
                    employee.name = employee.fullName;

                    return employee;
                });

                self.responseObj['#customerDd'] = employees;
            });

            dataService.getData('/employees/getForDD', {isEmployee: true}, function (employees) {
                employees = _.map(employees.data, function (employee) {
                    employee.name = employee.name.first + ' ' + employee.name.last;

                    return employee;
                });

                self.responseObj['#salesPersonDd'] = employees;
                self.responseObj['#archPersonDd'] = employees;

                self.responseObj['#taxDesc'] = [
                    {
                        _id : '增值税(普)',
                        name: '增值税(普)'
                    }, {
                        _id : '增值税(专)',
                        name: '增值税(专)'
                    }, {
                        _id : '营业税',
                        name: '营业税'
                    }
                ];

                self.responseObj['#bailType'] = [
                    {
                        _id : '公司',
                        name: '公司'
                    }, {
                        _id : '项目部',
                        name: '项目部'
                    }
                ];

                self.responseObj['#expDepart'] = [
                    {
                        _id : '副经理室',
                        name: '副经理室'
                    }, {
                        _id : '经营部',
                        name: '经营部'
                    }, {
                        _id : '其他',
                        name: '其他'
                    }
                ];

            });

            this.formProperty = new CompanyFormProperty({
                data    : formModel.company,
                saveDeal: self.saveDeal
            });

            this.renderTags();

            $thisEl.find('#companyHolder').html(
                this.formProperty.render().el
            );

            $thisEl.find('#contactHolder').html(
                new ContactFormProperty({
                    data    : formModel.customer,
                    saveDeal: self.saveDeal
                }).render().el
            );

            this.editorView = new EditorView({
                model      : this.formModel,
                contentType: 'Opportunities'
            });


            $thisEl.find('.notes').append(
                this.editorView.render().el
            );

            $thisEl.find('#expectedClosing').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                onSelect   : function (dateText) {
                    self.modelChanged['expectedClosing'] = new Date(dateText);
                    self.showButtons();
                }
            });

            /*$thisEl.find('#biderDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                onSelect   : function (dateText) {
                    self.modelChanged['biderDate'] = new Date(dateText);
                    self.showButtons();
                }
            });

            $thisEl.find('#openDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                onSelect   : function (dateText) {
                    self.modelChanged['openDate'] = new Date(dateText);
                    self.showButtons();
                }
            });

            $thisEl.find('#retDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                onSelect   : function (dateText) {
                    self.modelChanged['leadDate.retDate'] = new Date(dateText);
                    self.showButtons();
                }
            });

            $thisEl.find('#winDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                onSelect   : function (dateText) {
                    self.modelChanged['archerDate.winDate'] = new Date(dateText);
                    self.showButtons();
                }
            });

            $thisEl.find('#archDate').datepicker({
                dateFormat : 'yy-MM-dd',
                changeMonth: true,
                changeYear : true,
                monthNames: ['01','02','03','04','05','06', '07','08','09','10','11','12'],
                monthNamesShort: ['一月','二月','三月','四月','五月','六月', '七月','八月','九月','十月','十一月','十二月'],
                dayNamesMin: ['日','一','二','三','四','五','六'], 
                onSelect   : function (dateText) {
                    self.modelChanged['archerDate.archDate'] = new Date(dateText);
                    self.showButtons();
                }
            });*/

            $thisEl.find('.attachments').append(
                new AttachView({
                    model      : this.formModel,
                    contentType: 'opportunities'
                }).render().el
            );

            $thisEl.find('.followers').append(
                new Followers({
                    model         : this.formModel,
                    collectionName: 'opportunities'
                }).render().el
            );

            return this;
        }
    });

    return FormOpportunitiesView;
});
