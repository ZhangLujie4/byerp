define([
    'Backbone',
    'Underscore',
    'jQuery',
    'common',
    'constants',
    'dataService',
    'moment'
], function (Backbone, _, $, common, CONTENT_TYPES, dataService, moment) {
    'use strict';

    var Store = function () {
        this.save = function (name, data) {
            localStorage.setItem(name, JSON.stringify(data));
        };
        this.find = function (name) {
            var store = localStorage.getItem(name);
            return (store && JSON.parse(store)) || null;
        };
        this.remove = function (name) {
            localStorage.removeItem(name);
        };
        this.clear = function () {
            localStorage.clear();
        };
    };

    var runApplication = function (success) {
        var location = window.location.hash;
        var regExp = /password|home/;
        var url;

        if (!Backbone.History.started) {
            Backbone.history.start({silent: true});
        }
        if (success) {
            url = (App.requestedURL === null) ? Backbone.history.fragment : App.requestedURL;
            if ((url === '') || url === 'login' || regExp.test(url)) {
                url = 'easyErp';
            }

            Backbone.history.fragment = '';
            Backbone.history.navigate(url, {trigger: true});
        } else {
            if (App.requestedURL === null) {
                App.requestedURL = Backbone.history.fragment;
            }
            Backbone.history.fragment = '';

            if (regExp.test(location)) {
                url = location;
            } else {
                url = 'login';
            }

            Backbone.history.navigate(url, {trigger: true});
        }
    };

    var changeContentViewType = function (event, contentType, collection) {
        var windowLocation = window.location.hash;
        var windowLocHash = windowLocation.split('/')[3];
        var browserFilter = windowLocation.split('/filter=')[1];
        var id;
        var viewType;
        var url;
        var filter;
        var kanbanFilter = browserFilter ? JSON.parse(decodeURIComponent(browserFilter)) : null;
        var model;

        event.preventDefault();

        if (contentType) {
            this.contentType = contentType;
        }

        if (windowLocHash !== undefined && windowLocHash.length === 24) {
            id = windowLocHash;
        }

        viewType = $(event.target).attr('data-view-type');
        url = '#easyErp/' + this.contentType + '/' + viewType + (browserFilter ? '/filter=' + browserFilter : '');

        if (id) {
            if (viewType !== 'list' && (viewType !== 'thumbnails')) {
                url += '/' + id;
            }
            if (collection) {
                collection.setElement(id);
            }
        } else {

            if (viewType === 'form' && collection) {
                model = collection.getElement();
                url += '/' + model.attributes._id;
            }
        }

        if (id && (viewType === 'list') && (this.contentType === 'Tasks')) {
            filter = {
                project: {
                    key: 'project._id',
                    value: [id]
                }
            };

            url += '/filter=' + encodeURIComponent(JSON.stringify(filter));
        } else if (kanbanFilter && (viewType === 'kanban') && (this.contentType === 'Tasks')) {
            if (kanbanFilter.project) {
                url = '#easyErp/' + this.contentType + '/' + viewType + '/' + kanbanFilter.project.value[0];
            } else {
                url = '#easyErp/' + this.contentType + '/' + viewType;
            }
        }

        App.ownContentType = true;

        Backbone.history.navigate(url, {trigger: true});
    };

    var getCurrentVT = function (option) {
        var viewType;
        var savedFilter;
        var viewVariants;
        var j;

        if (option && (option.contentType !== App.contentType)) {
            App.ownContentType = false;
        }
        if (App.currentViewType === null) {
            if (option) {
                switch (option.contentType) {
                    case CONTENT_TYPES.IMPORT:
                    case CONTENT_TYPES.DASHBOARD:
                    case CONTENT_TYPES.TASKS:
                    case CONTENT_TYPES.PROFILES:
                    case CONTENT_TYPES.DEPARTMENTS:
                    case CONTENT_TYPES.INVOICE:
                    case CONTENT_TYPES.USERS:
                    case CONTENT_TYPES.JOBPOSITIONS:
                    case CONTENT_TYPES.DEGREES:
                    case CONTENT_TYPES.WRITEOFF:
                    case CONTENT_TYPES.STOCKCORRECTIONS:
                    case CONTENT_TYPES.SOURCEOFAPPLICANTS:
                    case CONTENT_TYPES.LEADS:
                    case CONTENT_TYPES.BIRTHDAYS:
                    case CONTENT_TYPES.INVENTORYREPORT:
                    case CONTENT_TYPES.LEADSWORKFLOW:
                    case CONTENT_TYPES.MYPROFILE:
                    case CONTENT_TYPES.QUOTATIONS:
                    case CONTENT_TYPES.ORDER:
                    case CONTENT_TYPES.ORDERS:
                    case CONTENT_TYPES.INVOICES:
                    case CONTENT_TYPES.INVOICE:
                    case CONTENT_TYPES.SUPPLIERPAYMENTS:
                    case CONTENT_TYPES.CUSTOMERPAYMENTS:
                    case CONTENT_TYPES.SALESQUOTATIONS:
                    case CONTENT_TYPES.SALESORDERS:
                    case CONTENT_TYPES.SALESINVOICES:
                    case CONTENT_TYPES.WTRACK:
                    case CONTENT_TYPES.PAYROLLEXPENSES:
                    case CONTENT_TYPES.MONTHHOURS:
                    case CONTENT_TYPES.BONUSTYPE:
                    case CONTENT_TYPES.STOCKTRANSACTIONS:
                    case CONTENT_TYPES.HOLIDAY:
                    case CONTENT_TYPES.VACATION:
                    case CONTENT_TYPES.CAPACITY:
                    case CONTENT_TYPES.JOBSDASHBOARD:
                    case CONTENT_TYPES.PAYROLLPAYMENTS:
                    case CONTENT_TYPES.INVOICEAGING:
                    case CONTENT_TYPES.CHARTOFACCOUNT:
                    case CONTENT_TYPES.JOURNAL:
                    case CONTENT_TYPES.JOURNALENTRY:
                    case CONTENT_TYPES.TRIALBALANCE:
                    case CONTENT_TYPES.SALARYREPORT:
                    case CONTENT_TYPES.PROFITANDLOSS:
                    case CONTENT_TYPES.BALANCESHEET:
                    case CONTENT_TYPES.CASHFLOW:
                    case CONTENT_TYPES.CLOSEMONTH:
                    case CONTENT_TYPES.SALESPROFORMA:
                    case CONTENT_TYPES.EXPENSESINVOICE:
                    case CONTENT_TYPES.EXPENSESPAYMENTS:
                    case CONTENT_TYPES.DIVIDENDINVOICE:
                    case CONTENT_TYPES.DIVIDENDPAYMENTS:
                    case CONTENT_TYPES.PURCHASEPAYMENTS:
                    case CONTENT_TYPES.PROFORMA:
                    case CONTENT_TYPES.CASHBOOK:
                    case CONTENT_TYPES.CASHTRANSFER:
                    case CONTENT_TYPES.REPORTSDASHBOARD:
                    case CONTENT_TYPES.CONTRACTJOBS:
                    case CONTENT_TYPES.CUSTOMDASHBOARD:
                    case CONTENT_TYPES.PROJECTSDASHBOARD:
                    case CONTENT_TYPES.MANUALENTRY:
                    case CONTENT_TYPES.PURCHASEORDERS:
                    case CONTENT_TYPES.PURCHASEINVOICES:
                    case CONTENT_TYPES.STOCKINVENTORY:
                    case CONTENT_TYPES.STOCKRETURNS:
                    case CONTENT_TYPES.MANUFACTURINGORDERS:
                    case CONTENT_TYPES.BILLOFMATERIALS:
                    case CONTENT_TYPES.WORKCENTERS:
                    case CONTENT_TYPES.ROUTINGS:
                    //---cy
                    case CONTENT_TYPES.PROJECTAPPROVAL:
                    case CONTENT_TYPES.CHARGEITEMS:
                    case CONTENT_TYPES.PROCESSCONTENTS:
                    case CONTENT_TYPES.WORKORDERS:
                    case CONTENT_TYPES.ORDERAPPROVAL:
                    case CONTENT_TYPES.ORDERRECKONS:
                    case CONTENT_TYPES.PIECEWAGES:
                    case CONTENT_TYPES.PROCESSDETAILS:
                    case CONTENT_TYPES.DESIGNREC:
                    case CONTENT_TYPES.ASSIGN:
                    case CONTENT_TYPES.ALUVENEERORDERS:
                    case CONTENT_TYPES.BUILDINGCONTRACT:
                    case CONTENT_TYPES.ALUORDERAPPROVAL:

                    //---wh
                    case CONTENT_TYPES.BUSITRIP:
                    case CONTENT_TYPES.BUSITRIPDETAIL:
                    case CONTENT_TYPES.BUSITRIPAPPROVE:
                    case CONTENT_TYPES.FILEMANAGEMENT:
                    case CONTENT_TYPES.CERTIFICATEHISTORY:
                    case CONTENT_TYPES.BORROWAFFIRM:
                    case CONTENT_TYPES.SETTINGSCERTIFICATE:
                    case CONTENT_TYPES.SETTINGSSTAMP:
                    case CONTENT_TYPES.STAMPAPPLICATION:
                    case CONTENT_TYPES.STAMPAPPROVE:
                    case CONTENT_TYPES.SOCIALINSURANCE:
                    case CONTENT_TYPES.ENGINEERINFO:
                    case CONTENT_TYPES.MANAGEMENTRULE:
                    case CONTENT_TYPES.SAFETYMANAGEMENT:
                    case CONTENT_TYPES.SAFETYMANAPPROVE:
                    case CONTENT_TYPES.CHECKSITUAPPROVE:
                    case CONTENT_TYPES.APPROVALPROCESS:
                    case CONTENT_TYPES.PRODUCTPARAMETER:
                    case CONTENT_TYPES.PRODUCTSURFACETREAT:
                    case CONTENT_TYPES.PRODUCTBUNCHTYPE:
                    case CONTENT_TYPES.GOODSINNOTES:
                    case CONTENT_TYPES.GOODSOUTNOTES:
                    case CONTENT_TYPES.GOODSPLAN:
                    //---wmt

                    case CONTENT_TYPES.ACCEPT:
                    case CONTENT_TYPES.BANKINFO:
                    case CONTENT_TYPES.BANKFINANCE:
                    case CONTENT_TYPES.FECERTIFICATE:
                    case CONTENT_TYPES.BORROW:
                    case CONTENT_TYPES.JOURNALEXAMINE:
                    case CONTENT_TYPES.BANKBOOK:
                    case CONTENT_TYPES.TAXCATEGORIES:
                    case CONTENT_TYPES.MAKEINVOICE:
                    case CONTENT_TYPES.ADDVALUETAXINVOICE:
                    case CONTENT_TYPES.CASHDEPOSIT:
                    case CONTENT_TYPES.ENTERPRISE:
                    case CONTENT_TYPES.DESIGNINVOICE:
                    case CONTENT_TYPES.CASHJOURNAL:
                    case CONTENT_TYPES.DESIGNROYALTY:
                    case CONTENT_TYPES.MARKETSETTINGS:
                    case CONTENT_TYPES.VOCATIONDETAILS:
                    case CONTENT_TYPES.DEPROYALTY:
                    case CONTENT_TYPES.ROYALTYDETAILS:
                    case CONTENT_TYPES.DESIGNBOOK:
                    case CONTENT_TYPES.PROJECTROYALTY:
                    case CONTENT_TYPES.INTERNALCONTRACT:
                    case CONTENT_TYPES.LABOURCONTRACT:
                    case CONTENT_TYPES.OUTCONTRACT:
                    case CONTENT_TYPES.MACHINECONTRACT:
                    case CONTENT_TYPES.PURCHASECONTRACT:
                    case CONTENT_TYPES.BUILDING:
                    case CONTENT_TYPES.PRODUCESCHEDULE:
                    case CONTENT_TYPES.PRODUCEMONITORING:
                    case CONTENT_TYPES.GOODSRETURN:
                    case CONTENT_TYPES.GOODSBARCODE:
                    case CONTENT_TYPES.GOODSSCRAP:
                    case CONTENT_TYPES.TIMECARD:
                    case CONTENT_TYPES.OEMORDERS:
                    case CONTENT_TYPES.OEMBARCODE:
                    case CONTENT_TYPES.SCANLOGS:
                    case CONTENT_TYPES.PROJECTFUND:
                    case CONTENT_TYPES.COSTAPPORTIONMENT:
                    case CONTENT_TYPES.OEMNOTES:
                    case CONTENT_TYPES.WORKPOINT:
                    case CONTENT_TYPES.DAILYREPORT:
                    case CONTENT_TYPES.COLORNUMBER:
                    case CONTENT_TYPES.ALUMINUMPRICE:
                    case CONTENT_TYPES.SHIPPINGNOTE:
                    case CONTENT_TYPES.SHIPPINGFEE:
                    case CONTENT_TYPES.SHIPPINGPLAN:
                    case CONTENT_TYPES.OEMOUTNOTE:

                        App.currentViewType = 'list';
                        break;
                    case CONTENT_TYPES.APPLICATIONS:
                    case CONTENT_TYPES.OPPORTUNITIES:
                        App.currentViewType = 'kanban';
                        break;
                    case CONTENT_TYPES.DEALTASKS:
                        App.currentViewType = 'datelist';
                        break;
                    default:
                        App.currentViewType = 'thumbnails';
                        break;
                }
            } else {
                App.currentViewType = 'thumbnails';
            }
            return App.currentViewType;
        } else {
            if (option && !App.ownContentType) {
                switch (option.contentType) {
                    case CONTENT_TYPES.IMPORT:
                    case CONTENT_TYPES.DASHBOARD:
                    case CONTENT_TYPES.TASKS:
                    case CONTENT_TYPES.PROFILES:
                    case CONTENT_TYPES.INVENTORYREPORT:
                    case CONTENT_TYPES.DEPARTMENTS:
                    case CONTENT_TYPES.USERS:
                    case CONTENT_TYPES.JOBPOSITIONS:
                    case CONTENT_TYPES.DEGREES:
                    case CONTENT_TYPES.SOURCEOFAPPLICANTS:
                    case CONTENT_TYPES.LEADS:
                    case CONTENT_TYPES.STOCKTRANSACTIONS:
                    case CONTENT_TYPES.WRITEOFF:
                    case CONTENT_TYPES.BIRTHDAYS:
                    case CONTENT_TYPES.LEADSWORKFLOW:
                    case CONTENT_TYPES.MYPROFILE:
                    case CONTENT_TYPES.QUOTATIONS:
                    case CONTENT_TYPES.ORDER:
                    case CONTENT_TYPES.ORDERS:
                    case CONTENT_TYPES.INVOICES:
                    case CONTENT_TYPES.INVOICE:
                    case CONTENT_TYPES.SUPPLIERPAYMENTS:
                    case CONTENT_TYPES.CUSTOMERPAYMENTS:
                    case CONTENT_TYPES.SALESQUOTATIONS:
                    case CONTENT_TYPES.SALESORDERS:
                    case CONTENT_TYPES.SALESINVOICES:
                    case CONTENT_TYPES.WTRACK:
                    case CONTENT_TYPES.PAYROLLEXPENSES:
                    case CONTENT_TYPES.MONTHHOURS:
                    case CONTENT_TYPES.BONUSTYPE:
                    case CONTENT_TYPES.STOCKCORRECTIONS:
                    case CONTENT_TYPES.HOLIDAY:
                    case CONTENT_TYPES.VACATION:
                    case CONTENT_TYPES.CAPACITY:
                    case CONTENT_TYPES.JOBSDASHBOARD:
                    case CONTENT_TYPES.PAYROLLPAYMENTS:
                    case CONTENT_TYPES.INVOICEAGING:
                    case CONTENT_TYPES.CHARTOFACCOUNT:
                    case CONTENT_TYPES.JOURNAL:
                    case CONTENT_TYPES.JOURNALENTRY:
                    case CONTENT_TYPES.TRIALBALANCE:
                    case CONTENT_TYPES.SALARYREPORT:
                    case CONTENT_TYPES.PROFITANDLOSS:
                    case CONTENT_TYPES.BALANCESHEET:
                    case CONTENT_TYPES.CASHFLOW:
                    case CONTENT_TYPES.CLOSEMONTH:
                    case CONTENT_TYPES.SALESPROFORMA:
                    case CONTENT_TYPES.EXPENSESINVOICE:
                    case CONTENT_TYPES.EXPENSESPAYMENTS:
                    case CONTENT_TYPES.DIVIDENDINVOICE:
                    case CONTENT_TYPES.DIVIDENDPAYMENTS:
                    case CONTENT_TYPES.PURCHASEPAYMENTS:
                    case CONTENT_TYPES.PROFORMA:
                    case CONTENT_TYPES.CASHBOOK:
                    case CONTENT_TYPES.CASHTRANSFER:
                    case CONTENT_TYPES.REPORTSDASHBOARD:
                    case CONTENT_TYPES.CONTRACTJOBS:
                    case CONTENT_TYPES.CUSTOMDASHBOARD:
                    case CONTENT_TYPES.PROJECTSDASHBOARD:
                    case CONTENT_TYPES.MANUALENTRY:
                    case CONTENT_TYPES.STOCKINVENTORY:
                    case CONTENT_TYPES.PURCHASEORDERS:
                    case CONTENT_TYPES.PURCHASEINVOICES:
                    case CONTENT_TYPES.STOCKRETURNS:
                    case CONTENT_TYPES.BILLOFMATERIALS:
                    case CONTENT_TYPES.WORKCENTERS:
                    case CONTENT_TYPES.ROUTING:
                    case CONTENT_TYPES.MANUFACTURINGORDERS:
                    //---cy
                    case CONTENT_TYPES.PROJECTAPPROVAL:
                    case CONTENT_TYPES.CHARGEITEMS:
                    case CONTENT_TYPES.PROCESSCONTENTS:
                    case CONTENT_TYPES.WORKORDERS:
                    case CONTENT_TYPES.ORDERAPPROVAL:
                    case CONTENT_TYPES.ORDERRECKONS:
                    case CONTENT_TYPES.PIECEWAGES:
                    case CONTENT_TYPES.PROCESSDETAILS:
                    case CONTENT_TYPES.DESIGNREC:
                    case CONTENT_TYPES.ASSIGN:
                    case CONTENT_TYPES.ALUVENEERORDERS:
                    case CONTENT_TYPES.BUILDINGCONTRACT:
                    case CONTENT_TYPES.ALUORDERAPPROVAL:

                    //---wh
                    case CONTENT_TYPES.BUSITRIP:
                    case CONTENT_TYPES.BUSITRIPDETAIL:
                    case CONTENT_TYPES.BUSITRIPAPPROVE:
                    case CONTENT_TYPES.FILEMANAGEMENT:
                    case CONTENT_TYPES.CERTIFICATEHISTORY:
                    case CONTENT_TYPES.BORROWAFFIRM:
                    case CONTENT_TYPES.SETTINGSCERTIFICATE:
                    case CONTENT_TYPES.SETTINGSSTAMP:
                    case CONTENT_TYPES.STAMPAPPLICATION:
                    case CONTENT_TYPES.STAMPAPPROVE:
                    case CONTENT_TYPES.SOCIALINSURANCE:
                    case CONTENT_TYPES.ENGINEERINFO:
                    case CONTENT_TYPES.MANAGEMENTRULE:
                    case CONTENT_TYPES.SAFETYMANAGEMENT:
                    case CONTENT_TYPES.SAFETYMANAPPROVE:
                    case CONTENT_TYPES.CHECKSITUAPPROVE:
                    case CONTENT_TYPES.APPROVALPROCESS:
                    case CONTENT_TYPES.PRODUCTPARAMETER:
                    case CONTENT_TYPES.PRODUCTSURFACETREAT:
                    case CONTENT_TYPES.PRODUCTBUNCHTYPE:

                    case CONTENT_TYPES.ACCEPT:
                    case CONTENT_TYPES.BANKINFO:
                    case CONTENT_TYPES.BANKFINANCE:
                    case CONTENT_TYPES.FECERTIFICATE:
                    case CONTENT_TYPES.BORROW:
                    case CONTENT_TYPES.JOURNALEXAMINE:
                    case CONTENT_TYPES.BANKBOOK:
                    case CONTENT_TYPES.TAXCATEGORIES:
                    case CONTENT_TYPES.MAKEINVOICE:
                    case CONTENT_TYPES.ADDVALUETAXINVOICE:
                    case CONTENT_TYPES.CASHDEPOSIT:
                    case CONTENT_TYPES.ENTERPRISE:
                    case CONTENT_TYPES.DESIGNINVOICE:
                    case CONTENT_TYPES.CASHJOURNAL:
                    case CONTENT_TYPES.DESIGNROYALTY:
                    case CONTENT_TYPES.MARKETSETTINGS:
                    case CONTENT_TYPES.VOCATIONDETAILS:
                    case CONTENT_TYPES.DEPROYALTY:
                    case CONTENT_TYPES.ROYALTYDETAILS:
                    case CONTENT_TYPES.DESIGNBOOK:
                    //zlf
                    case CONTENT_TYPES.GOODSINNOTES:
                    case CONTENT_TYPES.GOODSOUTNOTES:
                    case CONTENT_TYPES.GOODSPLAN:
                    case CONTENT_TYPES.PROJECTROYALTY:
                    case CONTENT_TYPES.INTERNALCONTRACT:
                    case CONTENT_TYPES.LABOURCONTRACT:
                    case CONTENT_TYPES.OUTCONTRACT:
                    case CONTENT_TYPES.MACHINECONTRACT:
                    case CONTENT_TYPES.PURCHASECONTRACT:
                    case CONTENT_TYPES.BUILDING:
                    case CONTENT_TYPES.PRODUCESCHEDULE:
                    case CONTENT_TYPES.PRODUCEMONITORING:
                    case CONTENT_TYPES.GOODSRETURN:
                    case CONTENT_TYPES.GOODSBARCODE:
                    case CONTENT_TYPES.GOODSSCRAP:
                    case CONTENT_TYPES.TIMECARD:
                    case CONTENT_TYPES.OEMORDERS:
                    case CONTENT_TYPES.OEMBARCODE:
                    case CONTENT_TYPES.SCANLOGS:
                    case CONTENT_TYPES.PROJECTFUND:
                    case CONTENT_TYPES.COSTAPPORTIONMENT:
                    case CONTENT_TYPES.OEMNOTES:
                    case CONTENT_TYPES.DAILYREPORT:
                    case CONTENT_TYPES.WORKPOINT:
                    case CONTENT_TYPES.COLORNUMBER:
                    case CONTENT_TYPES.ALUMINUMPRICE:
                    case CONTENT_TYPES.SHIPPINGNOTE:
                    case CONTENT_TYPES.SHIPPINGFEE:
                    case CONTENT_TYPES.SHIPPINGPLAN:
                    case CONTENT_TYPES.OEMOUTNOTE:

                        App.currentViewType = 'list';
                        break;
                    case CONTENT_TYPES.DEALTASKS:
                        App.currentViewType = 'datelist';
                        break;
                    case CONTENT_TYPES.APPLICATIONS:
                    case CONTENT_TYPES.OPPORTUNITIES:
                        App.currentViewType = 'kanban';
                        break;
                    default:
                        App.currentViewType = 'thumbnails';
                        break;
                }
            }
        }

        viewVariants = ['kanban', 'list', 'form', 'thumbnails', 'tform', 'datelist'];

        if ($.inArray(App.currentViewType, viewVariants) === -1) {
            App.currentViewType = 'thumbnails';
            viewType = 'thumbnails';
        } else {
            viewType = App.currentViewType;
        }

        // for default filter && defaultViewType
        /*if (option && option.contentType && App.filtersObject.savedFilters[option.contentType]) {
         savedFilter = App.filtersObject.savedFilters[option.contentType];

         for (j = savedFilter.length - 1; j >= 0; j--) {
         if (savedFilter[j]) {
         if (savedFilter[j].byDefault === option.contentType) {

         if (savedFilter[j].viewType) {
         viewType = savedFilter[j].viewType;
         }
         }
         }
         }
         }*/

        return viewType;
    };

    var setCurrentVT = function (viewType) {
        var viewVariants = ['kanban', 'list', 'form', 'thumbnails', 'tform'];

        if (viewVariants.indexOf(viewType) !== -1) {
            App.currentViewType = viewType;
        } else {
            viewType = 'thumbnails';
            App.currentViewType = viewType;
        }

        return viewType;
    };

    var getCurrentCL = function () {
        var testLength;
        var contentLength;

        if (App.currentContentLength === null) {
            App.currentContentLength = 0;
            return App.currentContentLength;
        }

        testLength = new RegExp(/^[0-9]{1}[0-9]*$/);

        if (!testLength.test(App.currentContentLength)) {
            App.currentContentLength = 0;
            contentLength = 0;
        } else {
            contentLength = App.currentContentLength;
        }
        return contentLength;
    };

    var setCurrentCL = function (length) {
        var testLength = new RegExp(/^[0-9]{1}[0-9]*$/);

        if (!testLength.test(length)) {
            length = 0;
        }
        App.currentContentLength = length;

        return length;
    };

    function applyDefaultSettings(chartControl) {
        chartControl.setImagePath('/crm_backbone_repo/images/');
        chartControl.setEditable(false);
        chartControl.showTreePanel(false);
        chartControl.showContextMenu(false);
        chartControl.showDescTask(true, 'd,s-f');
        chartControl.showDescProject(true, 'n,d');
    }

    function cacheToApp(key, data, notSaveInLocalStorage) {
        App.cashedData = App.cashedData || {};
        App.cashedData[key] = data;

        if (!notSaveInLocalStorage) {
            App.storage.save(key, data);
        }
    }

    function retriveFromCash(key) {
        App.cashedData = App.cashedData || {};

        return App.cashedData[key] || App.storage.find(key);
    }

    function removeFromCash(key) {
        App.cashedData = App.cashedData || {};

        delete App.cashedData[key];

        return App.storage.remove(key);
    }

    // ToDo refactor It
    var savedFilters = function (contentType, uIFilter) {
        var savedFilter;

        savedFilter = uIFilter;

        return savedFilter;
    };

    var getFilterById = function (id, contentType) {
        var filter;
        var length;
        var keys;
        var savedFilters;

        dataService.getData(CONTENT_TYPES.URLS.CURRENT_USER, null, function (response) {
            if (response && !response.error) {
                App.currentUser = response.user;
                App.filtersObject.savedFilters = response.savedFilters;

                length = App.filtersObject.savedFilters[contentType].length;
                savedFilters = App.filtersObject.savedFilters[contentType];
                for (var i = length - 1; i >= 0; i--) {
                    if (savedFilters[i]._id === id) {
                        keys = Object.keys(savedFilters[i].filter);
                        App.filtersObject.filter = savedFilters[i].filter[keys[0]];
                        return App.filtersObject.filter;
                    }
                }
            } else {
                console.log('can\'t fetch currentUser');
            }
        });
    };

    var getFiltersForContentType = function (contentType) {
        var length = App.currentUser.savedFilters.length;
        var filtersForContent = [];
        var filterObj = {};
        var savedFiltersArray = App.currentUser.savedFilters;

        for (var i = length - 1; i >= 0; i--) {
            if (savedFiltersArray[i].contentView === contentType) {
                filterObj = {};
                filterObj._id = savedFiltersArray[i]._id;
                filterObj.value = savedFiltersArray[i].filter[0];
                filtersForContent.push(filterObj);
            }
        }

        App.filtersObject.savedFilters[contentType] = filtersForContent;
        return filtersForContent;
    };

    var getFiltersValues = function (options, cb) {
        var contentType = options.contentType;
        var locationHash = window.location.hash;
        var filter = locationHash.split('/filter=')[1]; // For startDate & endDate in EmployeeFinder for filters in dashVac

        filter = (filter) ? JSON.parse(decodeURIComponent(filter)) : null;

        dataService.getData('/filter/' + contentType, {filter: filter}, function (response) {
            if (response && !response.error) {
                if (!App.filtersObject) {
                    App.filtersObject = {};
                }

                if (!App.filtersObject.filtersValues) {
                    App.filtersObject.filtersValues = {};
                }

                App.filtersObject.filtersValues[contentType] = response;

                if (cb && typeof cb === 'function') {
                    cb();
                }
            } else {
                console.log('can\'t fetch filtersValues');
            }
        });
    };

    var getWeeks = function (month, year) {
        var result = [];
        var startWeek;
        var endWeek;
        var diff;
        var isoWeeksInYear;
        var startDate;
        var endDate;
        var daysCount;
        var curWeek;
        var direction = -1;
        var i;

        function iterator(i, diff) {
            curWeek = endWeek - isoWeeksInYear + i * direction;

            if (i === diff) {
                daysCount = moment(startDate).endOf('isoWeek').date();
            } else if (i === 0) {
                curWeek = endWeek;
                daysCount = (moment(endDate).date() - moment(endDate).startOf('isoWeek').date() + 1);
            } else {
                daysCount = 7;
            }

            result.push({week: curWeek, daysCount: daysCount});
        }

        year = parseInt(year, 10);
        month = parseInt(month, 10);

        isoWeeksInYear = 0;
        startDate = moment([year, month - 1]);
        endDate = moment(startDate).endOf('month');

        startWeek = startDate.isoWeeks();
        endWeek = endDate.isoWeeks();

        diff = endWeek - startWeek;

        if (diff < 0) {
            direction = 1;
            isoWeeksInYear = moment().year(year - 1).isoWeeksInYear();
            diff += startWeek;
            endWeek = startWeek;

            for (i = 0; i <= diff; i++) {
                iterator(i, diff);
            }
        } else {
            for (i = diff; i >= 0; i--) {
                iterator(i, diff);
            }
        }

        return result;
    };

    var getDefSavedFilterForCT = function (contentType) {
        var object = App.filtersObject;
        var savedFiltersObject = object && object.savedFilters ? object.savedFilters[contentType] : [];
        var savedFiltersValues = savedFiltersObject && savedFiltersObject.length ? savedFiltersObject[0].filter : [];
        var defSavedFilter = _.findWhere(savedFiltersValues, {byDefault: true});
        var defSavedFilterValues = defSavedFilter ? defSavedFilter.filters : null;

        if (defSavedFilterValues) {
            App.storage.save(contentType + '.savedFilter', defSavedFilter.name);
        }

        return defSavedFilterValues ? _.extend({}, defSavedFilterValues) : null;
    };

    var getSavedFilterForCT = function (contentType) {
        var savedFilterName = App.storage.find(contentType + '.savedFilter');
        var object = App.filtersObject;
        var savedFiltersObject = object && object.savedFilters ? object.savedFilters[contentType] : [];
        var savedFilters = savedFiltersObject && savedFiltersObject.length ? savedFiltersObject[0].filter : [];
        var savedFilter = _.findWhere(savedFilters, {name: savedFilterName});
        var savedFilterValues = savedFilter ? savedFilter.filters : null;

        return savedFilterValues ? _.extend({}, savedFilterValues) : null;
    };

    App.storage = new Store();

    return {
        runApplication: runApplication,
        changeContentViewType: changeContentViewType,
        getCurrentVT: getCurrentVT,
        setCurrentVT: setCurrentVT,
        getCurrentCL: getCurrentCL,
        setCurrentCL: setCurrentCL,
        cacheToApp: cacheToApp,
        retriveFromCash: retriveFromCash,
        removeFromCash: removeFromCash,
        savedFilters: savedFilters,
        getFiltersForContentType: getFiltersForContentType,
        getFilterById: getFilterById,
        getWeeks: getWeeks,
        getFiltersValues: getFiltersValues,
        getDefSavedFilterForCT: getDefSavedFilterForCT,
        getSavedFilterForCT: getSavedFilterForCT
    };
});
