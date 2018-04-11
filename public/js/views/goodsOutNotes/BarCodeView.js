define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/goodsOutNotes/BarCode.html',
    'custom'
], function (Backbone, $, _, ParentView, BarCodeTemplate, custom) {

    var BarCodeView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'goodsOutNote',
        template   : _.template(BarCodeTemplate),
        responseObj: {},

        initialize: function (options) {
            _.bindAll(this, 'saveItem', 'render');
            this.barCodes = options.barCodes;
            this.orderRowId = options.orderRowId;
            this.render();
        },

        events: {
            'click #checkAllBarCodes' : 'checkAll',
            'click .checkbox': 'checked'
        },

        saveItem: function () {
            var $thisEl = this.$el;
            var $table = $thisEl.find('.list');
            var $checkedInputs;
            var ids = [];
            var barCodesForRows;
            var isNew = true;

            $checkedInputs = $table.find('input:checked');

            $.each($checkedInputs, function (index, each) {
                var $el = $(this);
                if($el.val() != "on"){
                    ids.push($el.val());
                }
            });

            ids = _.compact(ids);
            barCodesForRows = custom.retriveFromCash('barCodesForRows');

            if(barCodesForRows === null){
                barCodesForRows = [];
            }

            for(var i=0; i<barCodesForRows.length; i++){
                if(barCodesForRows[i].orderRowId === this.orderRowId){
                    barCodesForRows[i].barCodes = ids;
                    isNew = false;
                }
            }
            if(isNew){
                barCodesForRows.push({
                    orderRowId : this.orderRowId,
                    barCodes : ids
                });
            }

            custom.cacheToApp('barCodesForRows', barCodesForRows);

            this.hideBarCodeDialog();
        },

        hideBarCodeDialog: function(){
            $('.edit-dialog').remove();
        },

        checkAll: function (e) {
            var $thisEl = this.$el;
            var $el = e ? $(e.target) : $thisEl.find('#checkAllBarCodes');
            var $checkedContent = $thisEl.find('.list');

            var $checkboxes = $checkedContent.find(':checkbox');
            var check = $el.prop('checked');

            $checkboxes.prop('checked', check);
        },

        render: function () {
            var formString = this.template({barCodes: this.barCodes});
            var self = this;
            this.$el = $(formString).dialog({
                dialogClass: 'edit-dialog',
                width      : 600,
                position   : {
                    at: "top+45%"
                },

                title  : '勾选条码',
                buttons: {
                    save: {
                        text : '保存',
                        class: 'btn blue',
                        click: self.saveItem
                    },

                    cancel: {
                        text : '取消',
                        class: 'btn',
                        click: self.hideBarCodeDialog
                    }
                }
            });
            
            return this;
        },

        checked: function (e) {
            var $thisEl = this.$el;
            var $checkBoxes = $thisEl.find('.checkbox:checked:not(#checkAll)');
            var $checkAll = $thisEl.find('#checkAllBarCodes');
            var checkAllBool = ($checkBoxes.length === this.barCodes.length);
            $checkAll.prop('checked', checkAllBool);
        }
    });

    return BarCodeView;
});
