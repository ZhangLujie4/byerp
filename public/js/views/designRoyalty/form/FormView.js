/**
 * Created by wmt on 2017/7/25.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/designRoyalty/form/FormTemplate.html',
    'text!templates/designRoyalty/temps/documentTemp.html',
    'views/designRoyalty/form/PersonView',
    'views/dialogViewBase',
    'views/Assignees/AssigneesView',
    'common',
    'custom',
    'dataService',
    'populate',
    'constants',
    'helpers',
    'moment',
    'views/designRoyalty/receiveView',
    'text!templates/designRoyalty/historyList.html'
], function (Backbone,
             $,
             _,
             EditTemplate,
             DocumentTemplate,
             PersonView,
             BaseView,
             AssigneesView,
             common,
             Custom,
             dataService,
             populate,
             CONSTANTS,
             helpers,
             moment,
             receiveView,
             historyList) {
    'use strict';

    var FormView = BaseView.extend({
        contentType: CONSTANTS.DESIGNROYALTY,
        imageSrc   : '',
        template   : _.template(EditTemplate),
        templateDoc: _.template(DocumentTemplate),
        templateHistory: _.template(historyList),

        initialize: function (options) {
            if (options) {
                this.visible = options.visible;
                this.eventChannel = options.eventChannel;
            }


            _.bindAll(this, 'render', 'deleteItem');

            if (options.model) {
                this.currentModel = options.model;
            } else {
                this.currentModel = options.collection.getElement();
            }

            this.currentModel.urlRoot = '/designRoyalty';

           // this.currentModel.on('sync', this.render, this);
            this.responseObj = {};
        },

        events: {
            'click #createPerson' : 'createPerson',
            'click .goToEdit'     : 'goToEdit',
            'click .goToRemove'   : 'goToRemove',
            'click #receive' : 'createReceive'
        },

        createPerson: function (e) {
            return new PersonView({
                model : this.currentModel
            });
        },

        createReceive: function (e) {
            return new receiveView({
                model : this.currentModel
            });
        },

        render: function () {
            var $thisEl = this.$el;
            var model = this.currentModel.toJSON();
            var formString;
            var template;
            var historyList;
            formString = this.template({
                model        : model,
                visible      : this.visible,
                hidePrAndCust: this.hidePrAndCust
            });

            var royalty=model.royalties;
            var personRoyalty=[];

            var royaltyDetail;
            if(royalty.length>0){
                royaltyDetail=royalty[0].details;
                for(var k=0;k<royaltyDetail.length;k++){
                    var data={};
                    data.name=royaltyDetail[k].name;
                    data.royalty=royaltyDetail[k].amount;
                    personRoyalty.push(data);
                }
            }

           for(var i=1;i<royalty.length;i++){
                var detail=royalty[i].details;

                for(var j=0;j<detail.length;j++){
                    var same=1;
                    for(var m=0;m<personRoyalty.length;m++){

                        if(personRoyalty[m].name==detail[j].name){
                          personRoyalty[m].royalty=personRoyalty[m].royalty+detail[j].amount;
                          same=0;

                        }

                    }
                    if(same){
                        var datas={};
                        datas.name=detail[j].name;
                        datas.royalty=detail[j].amount;
                        personRoyalty.push(datas);
                        same=1;
                    }

               }
           }

           for(var m=0;m<model.royalties.length;m++){
               model.royalties[m].date=moment(model.royalties[m].date).format('YYYY-MM-DD');
           }


            template = this.templateDoc({
                model           : model,
                currencySplitter: helpers.currencySplitter,
                persons:personRoyalty
            });

            historyList = this.templateHistory({
                model           : model.royalties

            });

            $thisEl.html(formString);

            $thisEl.find('#templateDiv').html(template);

            $thisEl.find('#history').html(historyList);

            this.delegateEvents(this.events);

            App.stopPreload();

            return this;
        }
    });

    return FormView;
});
