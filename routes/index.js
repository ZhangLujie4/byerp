require('pmx').init();

//TODO 在这里给所有的函数方法赋值important!!!
/**
 * app 设置的所有的关于app默认路径以及默认检测
 * mainDb 把所有的DB的类型都包含在这里
 * dbsNames 把所有的{db.name，db.url}都放在这里
 * dbsObject 把所有的dbsobject[dbname]=dbobject中的所有集合类型都存在这里了
 * event 加载所有的响应事件
 * @param app
 * @param mainDb
 */
module.exports = function (app, mainDb) {
    'use strict';

    // var newrelic = require('newrelic');

    var event = require('../helpers/eventstHandler')(app, mainDb);
    var RESPONSES = require('../constants/responses');
    var CONSTANTS = require('../constants/mainConstants');
    var fs = require('fs');
    var dbsNames = app.get('dbsNames');
    var dbsObject = mainDb.dbsObject;
    //这里获取到models
    var models = require('../helpers/models.js')(dbsObject);
    var dailyReportRouter = require('./dailyReport')(models, event);
    var productRouter = require('./product')(models);
    var ordersRouter = require('./orders')(models, event);
    var invoicesRouter = require('./invoices')(models, event);
    var invoiceRouter = require('./invoice')(models, event);
    var proformaRouter = require('./proforma')(models, event);
    var supplierRouter = require('./supplier')(models);
    var quotationRouter = require('./quotation')(models, event);
    var destinationRouter = require('./destination')(models);
    var incotermRouter = require('./incoterm')(models);
    var weeklySchedulerRouter = require('./weeklyScheduler')(models);
    var scheduledPayRouter = require('./scheduledPay')(models);
    var payrollComponentTypesRouter = require('./payrollComponentTypes')(models);
    var invoicingControlRouter = require('./invoicingControl')(models);
    var paymentTermRouter = require('./paymentTerm')(models);
    var deliverToTermRouter = require('./deliverTo')(models);
    var workflowRouter = require('./workflow')(models, event);
    var paymentRouter = require('./payment')(models, event);
    var paymentMethodRouter = require('./paymentMethod')(models);
    var periodRouter = require('./period')(models);
    var projectRouter = require('./project')(models, event);
    var employeeRouter = require('./employee')(event, models);
    var applicationRouter = require('./application')(event, models);
    var projectMemberRouter = require('./projectMember')(models, event);
    var departmentRouter = require('./department')(models, event);
    var revenueRouter = require('./revenue')(models);
    var wTrackRouter = require('./wTrack')(event, models);
    var opportunityRouter = require('./opportunity')(models, event);
    var leadsRouter = require('./leads')(models, event);
    var jobPositionRouter = require('./jobPosition')(models);
    var holidayRouter = require('./holiday')(event, models);
    var modulesRouter = require('./modules')(models);
    var monthHoursRouter = require('./monthHours')(event, models);
    var vacationRouter = require('./vacation')(event, models);
    var bonusTypeRouter = require('./bonusType')(models);
    var dashboardRouter = require('./dashboard')(models);
    var expensesInvoiceRouter = require('./expensesInvoice')(models, event);
    var dividendInvoiceRouter = require('./dividendInvoice')(models, event);
    var filterRouter = require('./filter')(models);
    var industryRouter = require('./industry')(models);
    var productCategoriesRouter = require('./productCategories')(models, event);
    var customersRouter = require('./customers')(models, event);
    var shippingMethodRouter = require('./shippingMethod')(models, event);
    var manufacturingOrderRouter = require('./manufacturingOrder')(models, event);
    var workCentresRouter = require('./workCentres')(models, event);
    var routingRouter = require('./routing')(models, event);
    var billOfMaterials = require('./billOfMaterials')(models);

    var personsRouter = require('./person')(models, event);
    var capacityRouter = require('./capacity')(models);
    var payRollRouter = require('./payroll')(models);
    var importFileRouter = require('./importFile')(models);
    var paymentTypeRouter = require('./paymentType')(models);
    var payrollExprnsesRouter = require('./payrollExprnses')(models);
    var jobsRouter = require('./jobs')(models, event);
    var chartOfAccountRouter = require('./chartOfAccount')(models);
    var currencyRouter = require('./currency')(models);
    var prPositionRouter = require('./projectPosition')(models);
    var journalRouter = require('./journals')(models, event);
    var salaryReportRouter = require('./salaryReport')(models);
    var userRouter = require('./user')(event, models);
    var campaignRouter = require('./campaign')(models);
    var orgSettingsRouter = require('./orgSettings')(models);
    var degreesRouter = require('./degrees')(models);
    var profilesRouter = require('./profiles')(models);
    var tasksRouter = require('./tasks')(models, event);
    var tagRouter = require('./tags')(models, event);
    var dealTasksRouter = require('./dealTasks')(models, event);
    var journalEntriesRouter = require('./journalEntries')(models, event);
    var writeOffRouter = require('./writeOff')(models, event);
    var payrollStructureTypesRouter = require('./payrollStructureTypes')(models);
    var cashTransferRouter = require('./cashTransfer')(models, event);
    var countriesRouter = require('./countries')(models);
    var contractJobsRouter = require('./contractJobs')(models);
    var projectsDashboardRouter = require('./projectsDashboard')(models);
    var followersRouter = require('./followers')(models);
    var accountTypesRouter = require('./accountTypes')(models);
    var warehouseRouter = require('./warehouse')(models, event);
    var accountsCategoriesRouter = require('./accountsCategories')(models);
    var priceListRouter = require('./priceList')(models);
    var purchaseInvoicesRouter = require('./purchaseInvoices')(models, event);
    var stockTransactionRouter = require('./stockTransaction')(models, event);
    var stockInventoryRouter = require('./stockInventory')(models, event);
    //var channelRouter = require('./channel')(models, event);
    var taxSettingsRouter = require('./taxSettings')(models, event);
    var reportsRouter = require('./reports')(models, event);
    var imagesRouter = require('./images')(models, event);
    var stockReturnsRouter = require('./stockReturns')(models, event);
    var expensesCategoriesRouter = require('./expensesCategories')(models, event);
    var purchaseOrdersRouter = require('./purchaseOrders')(models, event);

    var projectapprovalRouter = require('./opportunity')(models, event);
    var chargeItemsRouter = require('./chargeItems')(models, event);
    var processContentsRouter = require('./processContents')(models, event);
    var workOrdersRouter = require('./workOrders')(models, event);
    var orderApprovalRouter = require('./orderApproval')(models, event);
    var orderReckonsRouter = require('./orderReckons')(models, event);
    var pieceWagesRouter = require('./pieceWages')(models, event);
    var processDetailsRouter = require('./processDetails')(models, event);
    var designRecRouter = require('./designRec')(models, event);
    var assignRouter = require('./assign')(models, event);
    var aluveneerOrdersRouter = require('./aluveneerOrders')(models, event);
    var buildingContractRouter = require('./buildingContract')(models, event);
    var aluorderApprovalRouter = require('./aluorderApproval')(models, event);
    
	var busiTripRouter = require('./busiTrip')(models);
    var busiTripDetailRouter = require('./busiTripDetail')(models);
    var busiTripApproveRouter = require('./busiTripApprove')(models);
	var fileManagementRouter = require('./fileManagement')(models);
    var certificateHistoryRouter = require('./certificateHistory')(models);
    var borrowAffirmRouter = require('./borrowAffirm')(models);
    var StampRouter = require('./stamp')(models);
    var stampApplicationRouter = require('./stampApplication')(models);
    var stampApproveRouter = require('./stampApprove')(models);
    var socialInsuranceRouter = require('./socialInsurance')(models);
    var engineerInfoRouter = require('./engineerInfo')(models);
    var managementRuleRouter = require('./managementRule')(models);
    var safetyManagementRouter = require('./safetyManagement')(models);
    var safetyManApproveRouter = require('./safetyManApprove')(models);
    var checkSituApproveRouter = require('./checkSituApprove')(models);
    var productParameterRouter = require('./productParameter')(models);
    var productSurfaceTreatRouter = require('./productSurfaceTreat')(models);
    var productBunchTypeRouter = require('./productBunchType')(models);
	
	var acceptRouter = require('./accept')(models, event);
    var bankInfoRouter = require('./bankInfo')(models, event);
    var bankFinanceRouter = require('./bankFinance')(models, event);
    var FECertificateRouter = require('./FECertificate')(models, event);
    var borrowRouter = require('./borrow')(models, event);
    var bankbookRouter = require('./bankbook')(models, event);
    var taxCategoriesRouter=require('./taxCategories')(models,event);
    var addValueTaxInvoiceRouter=require('./addValueTaxInvoice')(models,event);
    var makeInvoiceRouter=require('./makeInvoice')(models,event);
    var cashDepositRouter=require('./cashDeposit')(models,event);
    var enterpriseRouter=require('./enterprise')(models,event);
    var designInvoiceRouter=require('./designInvoice')(models,event);
    var designRoyaltyRouter=require('./designRoyalty')(models,event);
	var designProjectRouter = require('./designProject')(models, event);
	
	var depRoyaltyRouter = require('./depRoyalty')(models, event);
	var royaltyDetailsRouter = require('./royaltyDetails')(models, event);
	var marketSettingsRouter = require('./marketSettings')(models, event);
	var plantWorkGroupRouter = require('./plantWorkGroup')(models);
    var barCodeRouter = require('./barCode')(models);
    var goodsInRouter = require('./goodsIn')(models, event);
    var goodsOutRouter = require('./goodsOut')(models, event);
    var goodsPlanRouter = require('./goodsPlan')(models, event);
    var projectRoyaltyRouter = require('./projectRoyalty')(models, event);
    var departmentExternalRouter = require('./departmentExternal')(models);
    var personExternalRouter = require('./personExternal')(models);
    var taxRouter = require('./tax')(models);
    var taxFreeRouter = require('./taxFree')(models);
    var personDeductionRouter = require('./personDeduction')(models);
    var minimumWageRouter = require('./minimumWage')(models);
    var missionAllowanceRouter = require('./missionAllowance')(models);
    var InternalContractRouter = require('./internalContract')(models, event);
    var LabourContractRouter = require('./labourContract')(models, event);
    var MachineContractRouter = require('./machineContract')(models, event);
    var PurchaseContractRouter = require('./purchaseContract')(models, event);
    var OutContractRouter = require('./outContract')(models, event);
    var BuildingRouter = require('./building')(models, event);
    var ProduceScheduleRouter = require('./produceSchedule')(models, event);
    var ProduceMonitoringRouter = require('./produceMonitoring')(models, event);
    var GoodsReturnRouter = require('./goodsReturn')(models, event);
    var GoodsBarcodeRouter = require('./goodsBarcode')(models, event);
    var GoodsScrapRouter = require('./goodsScrap')(models, event);
    var ScanlogsRouter = require('./scanlogs')(models, event);
    var TimeCardRouter = require('./timeCard')(models, event);	
    var customChartRouter = require('./customChart')(models);
    var customDashboardRouter = require('./customDashboard')(models);
    var oemOrdersRouter = require('./oemOrders')(models, event);
    var OemBarcodeRouter = require('./oemBarcode')(models, event);
    var ProjectFundRouter = require('./ProjectFund')(models, event);
    var costApportionmentRouter=require('./costApportionment')(models);
    var OemNotesRouter = require('./oemNotes')(models, event);
    var workPointRouter = require('./workPoint')(models, event); //TODO =============>
    var colorNumberRouter = require('./colorNumber')(models, event);
    var AluminumPriceRouter = require('./aluminumPrice')(models, event);
    var labourAttendanceRouter = require('./labourAttendance')(models, event);
    var designBookRouter=require('./designBook')(models,event);
    var shippingNoteRouter = require('./shippingNote')(models);
    var shippingFeeRouter = require('./shippingFee')(models, event);
    var shippingPlanRouter = require('./shippingPlan')(models, event);
    var oemOutNoteRouter = require('./oemOutNote')(models);
    var logger = require('../helpers/logger');
    var exportToPdf = require('../helpers/pdfExtractor');
    var async = require('async');
    var redisStore = require('../helpers/redisClient');

    var tracker = require('../helpers/tracker.js');
    var geoip = require('geoip-lite');

    var sessionValidator = function (req, res, next) {
        var session = req.session;
        var month = 2678400000;

        if (session) {
            if (session.rememberMe) {
                session.cookie.maxAge = month;
            } else {
                session.cookie.maxAge = CONSTANTS.SESSION_TTL;
            }
        }

        next();
    };

    var tempFileCleaner = function (req, res, next) {
        res.on('finish', function () {
            if (req.files) {
                Object.keys(req.files).forEach(function (file) {
                    fs.unlink(req.files[file].path, function (err) {
                        if (err) {
                            logger.error(err);
                        }
                    });
                });
            }
        });
        next();
    };

    require('../helpers/arrayExtender');

    //定义了app的一些默认的路由
    app.use(sessionValidator);
    app.use(tempFileCleaner);

    app.set('logger', logger);

    // requestHandler = require('../requestHandler.js')(app, event, mainDb);

    app.get('/', function (req, res, next) {
        res.sendfile('index.html');
    });

    app.use('/dailyReport', dailyReportRouter);
    app.use('/filter', filterRouter);
    app.use('/products', productRouter);
    app.use('/order', ordersRouter);
    app.use('/invoices', invoiceRouter);
    app.use('/invoice', invoicesRouter);
    app.use('/proforma', proformaRouter);
    app.use('/expensesInvoice', expensesInvoiceRouter);
    app.use('/dividendInvoice', dividendInvoiceRouter);
    app.use('/supplier', supplierRouter);
    app.use('/quotations', quotationRouter);
    app.use('/destination', destinationRouter);
    app.use('/incoterm', incotermRouter);
    app.use('/invoicingControl', invoicingControlRouter);
    app.use('/paymentTerm', paymentTermRouter);
    app.use('/deliverTo', deliverToTermRouter);
    app.use('/weeklyScheduler', weeklySchedulerRouter);
    app.use('/scheduledPay', scheduledPayRouter);
    app.use('/payrollComponentTypes', payrollComponentTypesRouter);
    app.use('/workflows', workflowRouter);
    app.use('/payments', paymentRouter);
    app.use('/period', periodRouter);
    app.use('/organizationSettings', orgSettingsRouter);
    app.use('/paymentMethod', paymentMethodRouter);
    app.use('/importFile', importFileRouter);
    app.use('/wTrack', wTrackRouter);
    app.use('/projects', projectRouter);
    app.use('/employees', employeeRouter);
    app.use('/applications', applicationRouter);
    app.use('/departments', departmentRouter);
    app.use('/revenue', revenueRouter);
    app.use('/salaryReport', salaryReportRouter);
    app.use('/opportunities', opportunityRouter);
    app.use('/leads', leadsRouter);
    app.use('/jobPositions', jobPositionRouter);
    app.use('/holiday', holidayRouter);
    app.use('/vacation', vacationRouter);
    app.use('/monthHours', monthHoursRouter);
    app.use('/modules', modulesRouter);
    app.use('/bonusType', bonusTypeRouter);
    app.use('/industry', industryRouter);
    app.use('/dashboard', dashboardRouter);
    app.use('/dealTasks', dealTasksRouter);
    app.use('/category', productCategoriesRouter);
    app.use('/customers', customersRouter);
    app.use('/companies', customersRouter);
    app.use('/persons', personsRouter);
    app.use('/capacity', capacityRouter);
    app.use('/payroll', payRollRouter);
    app.use('/jobs', jobsRouter);
    app.use('/paymentType', paymentTypeRouter);
    app.use('/payrollExprnses', payrollExprnsesRouter);
    app.use('/chartOfAccount', chartOfAccountRouter);
    app.use('/currency', currencyRouter);
    app.use('/projectPosition', prPositionRouter);
    app.use('/projectMember', projectMemberRouter);
    app.use('/journals', journalRouter);
    app.use('/journalEntries', journalEntriesRouter);
    app.use('/campaigns', campaignRouter);
    app.use('/degrees', degreesRouter);
    app.use('/profiles', profilesRouter);
    app.use('/tasks', tasksRouter);
    app.use('/tags', tagRouter);
    app.use('/users', userRouter);
    app.use('/writeOff', writeOffRouter);
    app.use('/payrollStructureTypes', payrollStructureTypesRouter);
    app.use('/cashTransfer', cashTransferRouter);
    app.use('/countries', countriesRouter);
    app.use('/contractJobs', contractJobsRouter);
    app.use('/projectsDashboard', projectsDashboardRouter);
    app.use('/followers', followersRouter);
    app.use('/customChart', customChartRouter);
    app.use('/customDashboard', customDashboardRouter);
    app.use('/accountTypes', accountTypesRouter);
    app.use('/warehouse', warehouseRouter);  
    app.use('/accountsCategories', accountsCategoriesRouter);
    app.use('/purchaseInvoices', purchaseInvoicesRouter);
    app.use('/priceList', priceListRouter);
    //app.use('/channels', channelRouter);
    app.use('/taxSettings', taxSettingsRouter);
    app.use('/reports', reportsRouter);
    app.use('/shippingMethod', shippingMethodRouter);
    app.use('/image', imagesRouter);
    app.use('/stockReturns', stockReturnsRouter);
    app.use('/expensesCategories', expensesCategoriesRouter);
    app.use('/stockTransactions', stockTransactionRouter);
    app.use('/stockInventory', stockInventoryRouter);
    app.use('/manufacturingOrders', manufacturingOrderRouter);
    app.use('/workCentre', workCentresRouter);
    app.use('/routing', routingRouter);
    app.use('/billOfMaterials', billOfMaterials);

    app.use('/projectapproval', projectapprovalRouter);
    app.use('/chargeItems', chargeItemsRouter);
    app.use('/processContents', processContentsRouter);
    app.use('/workOrders', workOrdersRouter);
    app.use('/orderApproval', orderApprovalRouter);
    app.use('/orderReckons', orderReckonsRouter);
    app.use('/pieceWages', pieceWagesRouter);
    app.use('/processDetails', processDetailsRouter);
    app.use('/designRec', designRecRouter);
    app.use('/assign', assignRouter);
    app.use('/aluveneerOrders', aluveneerOrdersRouter);
    app.use('/buildingContract', buildingContractRouter);
    app.use('/aluorderApproval', aluorderApprovalRouter);
	
	app.use('/busiTrip',busiTripRouter);
    app.use('/busiTripDetail', busiTripDetailRouter);
    app.use('/busiTripApprove', busiTripApproveRouter);
	app.use('/fileManagement', fileManagementRouter);
    app.use('/certificateHistory', certificateHistoryRouter);
    app.use('/borrowAffirm', borrowAffirmRouter);
    app.use('/settingsStamp', StampRouter);
    app.use('/stampApplication', stampApplicationRouter);
    app.use('/stampApprove', stampApproveRouter);
    app.use('/socialInsurance', socialInsuranceRouter);
    app.use('/engineerInfo', engineerInfoRouter);
    app.use('/managementRule', managementRuleRouter);
    app.use('/safetyManagement', safetyManagementRouter);
    app.use('/safetyManApprove', safetyManApproveRouter);
    app.use('/checkSituApprove', checkSituApproveRouter);
    app.use('/productParameter', productParameterRouter);
    app.use('/productSurfaceTreat', productSurfaceTreatRouter);
    app.use('/productBunchType', productBunchTypeRouter);
	
	app.use('/accept', acceptRouter);
    app.use('/bankInfo', bankInfoRouter);
    app.use('/bankFinance', bankFinanceRouter);
    app.use('/FECertificate', FECertificateRouter);
    app.use('/borrow', borrowRouter);
    app.use('/bankbook',bankbookRouter);
    app.use('/taxCategories',taxCategoriesRouter);
    app.use('/addValueTaxInvoice',addValueTaxInvoiceRouter);
    app.use('/makeInvoice',makeInvoiceRouter);
    app.use('/cashDeposit',cashDepositRouter);
    app.use('/enterprise',enterpriseRouter);
    app.use('/designInvoice',designInvoiceRouter);
	app.use('/DesignProjects',designProjectRouter);
    app.use('/designRoyalty',designRoyaltyRouter);
	app.use('/depRoyalty', depRoyaltyRouter);
	app.use('/royaltyDetails', royaltyDetailsRouter);
	app.use('/marketSettings', marketSettingsRouter);
	app.use('/plantWorkGroup',plantWorkGroupRouter);
    app.use('/barCode',barCodeRouter);
    app.use('/purchaseOrders', purchaseOrdersRouter);
    app.use('/goodsInNotes', goodsInRouter);
    app.use('/goodsOutNotes', goodsOutRouter);
    app.use('/goodsPlan', goodsPlanRouter);
    app.use('/projectRoyalty', projectRoyaltyRouter);	
    app.use('/departmentExternal', departmentExternalRouter);
    app.use('/personExternal', personExternalRouter);
    app.use('/tax', taxRouter);
    app.use('/taxFree', taxFreeRouter);
    app.use('/personDeduction', personDeductionRouter);
    app.use('/minimumWage', minimumWageRouter);
    app.use('/missionAllowance', missionAllowanceRouter);
    app.use('/internalContract', InternalContractRouter);
    app.use('/labourContract', LabourContractRouter);
    app.use('/purchaseContract', PurchaseContractRouter);
    app.use('/machineContract', MachineContractRouter);
    app.use('/outContract', OutContractRouter);
    app.use('/building', BuildingRouter);
    app.use('/produceSchedule', ProduceScheduleRouter);
    app.use('/produceMonitoring', ProduceMonitoringRouter);
    app.use('/goodsReturn', GoodsReturnRouter);
    app.use('/goodsBarcode', GoodsBarcodeRouter);
    app.use('/goodsScrap', GoodsScrapRouter);
    app.use('/scanlogs', ScanlogsRouter);
    app.use('/timeCard', TimeCardRouter);
    app.use('/oemOrders', oemOrdersRouter);
    app.use('/oemBarcode', OemBarcodeRouter);
    app.use('/ProjectFund', ProjectFundRouter);
    app.use('/oemNotes', OemNotesRouter);
    app.use('/workPoint', workPointRouter);
    app.use('/colorNumber', colorNumberRouter);
    app.use('/aluminumPrice', AluminumPriceRouter);
    app.use('/labourAttendance', labourAttendanceRouter);
    app.use('/DesignBook',designBookRouter);
    app.use('/costApportionment',costApportionmentRouter);
    app.use('/shippingNote', shippingNoteRouter);
    app.use('/shippingFee', shippingFeeRouter);
    app.use('/shippingPlan', shippingPlanRouter);
    app.use('/oemOutNote', oemOutNoteRouter);
    /**
     *@api {get} /getDBS/ Request DBS
     *
     * @apiVersion 0.0.1
     * @apiName getDBS
     * @apiGroup Index File
     *
     * @apiSuccess {String} DBS
     * @apiSuccessExample Success-Response:
     HTTP/1.1 200 OK
     {
         "dbsNames": {
             "sergey": {
                 "DBname": "sergey",
                 "url": "144.76.56.111"
             },
             "pavlodb": {
                 "DBname": "pavlodb",
                 "url": "144.76.56.111"
             },
             "romadb": {
                 "DBname": "romadb",
                 "url": "144.76.56.111"
             },
             "vasyadb": {
                 "DBname": "vasyadb",
                 "url": "144.76.56.111"
             },
             "fabio_lunardi": {
                 "DBname": "fabio_lunardi",
                 "url": "144.76.56.111"
             },
             "alexKhutor": {
                 "DBname": "alexKhutor",
                 "url": "144.76.56.111"
             },
             "lilyadb": {
                 "DBname": "lilyadb",
                 "url": "144.76.56.111"
             },
             "micheldb": {
                 "DBname": "micheldb",
                 "url": "144.76.56.111"
             },
             "alex": {
                 "DBname": "alex",
                 "url": "144.76.56.111"
             }
         }
     }
     */
    app.get('/getDBS', function (req, res) {
        res.send(200, {dbsNames: dbsNames});
    });

    app.post('/exportToPdf', exportToPdf.post);
    app.get('/exportToPdf', exportToPdf.get);

    /**
     *@api {get} /currentDb/ Request CurrentDb
     *
     * @apiVersion 0.0.1
     * @apiName getCurrentDb
     * @apiGroup Index File
     *
     * @apiSuccess {String} CurrentDb
     * @apiSuccessExample Success-Response:
     HTTP/1.1 200 OK
     "vasyadb"
     */
    app.get('/currentDb', function (req, res, next) {
        if (req.session && req.session.lastDb) {
            res.status(200).send(req.session.lastDb);
        } else {
            res.status(401).send();
        }
    });

    /**
     *@api {get} /account/authenticated/ Request for checking authentication
     *
     * @apiVersion 0.0.1
     * @apiName getAuthStatus
     * @apiGroup Index File
     *
     * @apiSuccess {String} AuthStatus
     * @apiSuccessExample Success-Response:
     HTTP/1.1 200 OK
     "OK"
     */
    app.get('/account/authenticated', function (req, res, next) {
        if (req.session && req.session.loggedIn) {
            res.send(200);
        } else {
            res.send(401);
        }
    });

    app.get('/download/:path', function (req, res) {
        var path = req.param('path');

        res.download(path);
    });

    app.get('/logout', function (req, res, next) {
        var session = req.session;

        if (session) {
            session.destroy(function (err) {
                if (err) {
                    return next(err);
                }
            });

        }

        res.clearCookie('lastDb');
        res.redirect('/#login');
    });

    app.get('/clearCashStorage', function (req, res, next) {
        redisStore.removeAllStorages(function (err) {
            if (err) {
                return next(err);
            }
            event.emit('clearAllCashedData');
            res.status(200).send({success: 'All cash cleaned success'});
        });
    });

    app.get('/nginx', function (req, res, next) {
        var geoip = require('geoip-lite');
        var ip = req.headers['x-real-ip'] || '127.0.0.1';
        var geo = geoip.lookup(ip);

        res.status(200).send(geo);
    });

    app.post('/track', function (req, res) {
        var RegExp = /production|test_demo/;
        var body = req.body;
        var ip = req.headers ? req.headers['x-real-ip'] : req.ip;
        var geo = geoip.lookup(ip);

        function mapper(body) {
            body.ip = ip;
            body.country = (!body.country && geo) ? geo.country : '';
            body.city = (!body.city && geo) ? geo.city : '';
            body.region = (!body.region && geo) ? geo.region : '';

            body.registrType = process.env.SERVER_TYPE;
            body.server = process.env.SERVER_PLATFORM;
        }

        ip = ip || '127.0.0.1';

        if (body instanceof Array) {
            body.map(mapper);
        } else {
            mapper(body);
        }

        res.status(200).send();

        if (!RegExp.test(process.env.SERVER_TYPE)) {
            tracker.track(body);
        }
    });

    function notFound(req, res, next) {
        res.status(404);

        if (req.accepts('html')) {
            return res.send(RESPONSES.PAGE_NOT_FOUND);
        }

        if (req.accepts('json')) {
            return res.json({error: RESPONSES.PAGE_NOT_FOUND});
        }

        res.type('txt');
        res.send(RESPONSES.PAGE_NOT_FOUND);

    }

    function errorHandler(err, req, res, next) {
        var status = err.status || 500;

        if (process.env.NODE_ENV === 'production') {
            res.status(status).send({error: err.message + '\n' + err.stack});
        } else {
            res.status(status).send({error: err.message + '\n' + err.stack});
        }

        if (status !== 401) {
            logger.error(err.message + '\n' + err.stack);
        }
    }

    // requestHandler.initScheduler();

    app.use(notFound);
    app.use(errorHandler);
};
