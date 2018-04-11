'use strict';

(function () {
    var root;

    var FILTERS = {
        Payment: {
            date: {
                type   : 'date',
                backend: {
                    key     : 'date',
                    operator: ['$gte', '$lte']
                }
            }
        },

        wTrack: {
            employee: {
                displayName: 'Employee',
                backend    : 'employee._id'
            },

            customer: {
                displayName: 'Customer',
                backend    : 'customer._id'
            },

            project: {
                displayName: 'Project Name',
                backend    : 'project._id'
            },

            department: {
                displayName: 'Department',
                backend    : 'department._id'
            },

            month: {
                displayName: 'Month',
                backend    : 'month',
                type       : 'integer'
            },

            year: {
                displayName: 'Year',
                backend    : 'year',
                type       : 'integer'
            },

            week: {
                displayName: 'Week',
                backend    : 'week',
                type       : 'integer'
            },

            _type: {
                displayName: 'Type',
                backend    : '_type',
                type       : 'string'
            },

            jobs: {
                backend: 'jobs'
            },

            array: ['employee', 'customer', 'project', 'department', 'month', 'year', 'week', '_type']
        },

        Persons: {
            name: {
                displayName: 'Full Name',
                backend    : '_id'
            },

            country: {
                displayName: 'Country',
                backend    : 'address.country',
                type       : 'string'
            },

            services: {
                displayName: 'Services',
                backend    : 'services',
                type       : 'boolean'
            },

            array: ['name', 'country', 'services']
        },

        DashVacation: {
            name: {
                displayName: 'Employee',
                backend    : 'employee'
            },

            department: {
                displayName: 'Department',
                backend    : 'department._id'
            },

            projecttype: {
                displayName: 'Project Type',
                backend    : 'project.projecttype',
                type       : 'string'
            },

            salesManager: {
                displayName: 'Sales Manager',
                backend    : 'salesManager.employeeId'
            },

            array: ['name', 'department', 'projecttype', 'salesManager']
        },

        DealTasks: {
            name      : {
                displayName: 'Name',
                backend    : '_id'
            },
            category  : {
                displayName: 'Category',
                backend    : 'category'
            },
            assignedTo: {
                displayName: 'Assigned To',
                backend    : 'assignedTo'
            },
            workflow  : {
                displayName: 'Status',
                backend    : 'workflow'
            },
            deal      : {
                displayName: 'Deal',
                backend    : 'deal'
            },

            array: ['name', 'assignedTo', 'workflow', 'deal', 'category']
        },

        Companies: {
            name: {
                displayName: 'Name',
                backend    : '_id'
            },

            country: {
                displayName: 'Country',
                backend    : 'address.country',
                type       : 'string'
            },

            services: {
                displayName: 'Services',
                backend    : 'services'
            },

            array: ['name', 'country', 'services']
        },

        Employees: {
            name: {
                backend    : '_id',
                displayName: '姓名'
            },

            department: {
                backend    : 'department._id',
                displayName: '部门'
            },

            manager: {
                backend    : 'manager._id',
                displayName: '经理'
            },

            jobPosition: {
                backend    : 'jobPosition._id',
                displayName: '岗位'
            },

            array: ['name', 'department', 'manager', 'jobPosition']
        },

        Applications: {
            name: {
                displayName: 'Full Name',
                backend    : '_id'
            },

            department: {
                displayName: 'Department',
                backend    : 'department._id'
            },

            jobPosition: {
                displayName: 'Job Position',
                backend    : 'jobPosition._id'
            },

            array: ['name', 'department', 'jobPosition']
        },

        /* JobPositions: {
         name: {
         displayName: 'Name',
         backend    : 'name'
         },

         workflow: {
         displayName: 'Status',
         backend    : 'workflow'
         },

         department: {
         displayName: 'Department',
         backend    : 'department'
         }
         }, */

        salesInvoices: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            supplier: {
                displayName: 'Customer',
                backend    : 'supplier._id'
            },

            salesPerson: {
                displayName: 'Assigned',
                backend    : 'salesPerson._id'
            },

            project: {
                displayName: 'Project Name',
                backend    : 'project._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            array: ['supplier', 'salesPerson', 'project', 'workflow']
        },

        ExpensesInvoice: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            supplier: {
                displayName: 'Supplier',
                backend    : 'supplier._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            array: ['supplier', 'workflow']
        },

        WriteOff: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            project: {
                displayName: 'Project',
                backend    : 'project._id'
            },
            journal: {
                displayName: 'Journal',
                backend    : 'journal._id'
            },
            array  : ['project', 'journal']
        },

        DividendInvoice: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            }
        },

        salesProforma: {
            supplier: {
                displayName: 'Customer',
                backend    : 'supplier._id'
            },

            salesPerson: {
                displayName: 'Assigned',
                backend    : 'salesPerson._id'
            },

            project: {
                displayName: 'Project Name',
                backend    : 'project._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            array: ['supplier', 'salesPerson', 'project', 'workflow']
        },

        Projects: {
            name: {
                displayName: 'Project Name',
                backend    : '_id'
            },

            customer: {
                displayName: 'Contact',
                backend    : 'customer._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            salesManager: {
                displayName: 'Sales Manager',
                backend    : 'salesManager._id'
            },

            projectManager: {
                displayName: 'Project Manager',
                backend    : 'projectManager._id'
            },

            summary: {
                backend: '_id'
            },

            type: {
                backend: 'projecttype',
                type   : 'string'
            },

            assignedTo: {
                backend: 'assignedTo._id'
            },

            array: ['name', 'customer', 'workflow', 'salesManager', 'projectManager']
        },

        contractJobs: {
            project: {
                displayName: 'Project Name',
                backend    : 'project._id'
            },

            customer: {
                displayName: 'Contact',
                backend    : 'project.customer'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            salesManager: {
                displayName: 'Sales Manager',
                backend    : 'salesManager.employeeId'
            },

            projectManager: {
                displayName: 'Project Manager',
                backend    : 'projectManager.employeeId'
            },

            array: ['project', 'customer', 'workflow', 'salesManager', 'projectManager']
        },

        Leads: {
            name: {
                displayName: '工程名称',
                backend    : 'name',
                type       : 'string',
            },

            customer: {
                displayName: '建设单位',
                backend    : 'customer._id'
            },

            workflow: {
                displayName: '状态',
                backend    : 'workflow._id'
            },

            createdBy: {
                displayName: '编辑人',
                backend    : 'createdBy.user._id'
            },

            array: ['name', 'customer', 'workflow', 'createdBy']
        },

        Opportunities: {
            name: {
                displayName: '工程名称',
                backend    : 'name',
                type       : 'string',
            },

            customer: {
                displayName: '建设单位',
                backend    : 'customer._id'
            },

            workflow: {
                displayName: '状态',
                backend    : 'workflow._id'
            },

            array: ['name', 'customer', 'workflow']
        },

        Tasks: {
            project: {
                displayName: 'Project',
                backend    : 'project'
            },

            summary: {
                displayName: 'Task Summary',
                backend    : 'summary'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow'
            },

            assignedTo: {
                displayName: 'Assigned To',
                backend    : 'assignedTo'
            },

            type: {
                displayName: 'Type',
                backend    : 'type',
                type       : 'string'
            }
        },

        customerPayments: {
            assigned: {
                displayName: 'Assigned',
                backend    : 'assigned._id'
            },

            supplier: {
                displayName: 'Company',
                backend    : 'supplier._id'
            },

            paymentMethod: {
                displayName: 'Payment way',
                backend    : 'paymentMethod._id'
            },

            name: {
                displayName: 'Name',
                backend    : '_id'
            }
        },

        supplierPayments: {
            supplier: {
                displayName: 'Employee',
                backend    : 'supplier._id'
            },

            paymentRef: {
                displayName: 'Bonus Type',
                backend    : 'paymentRef',
                type       : 'string'
            },

            year: {
                displayName: 'Year',
                backend    : 'year',
                type       : 'integer'
            },

            month: {
                displayName: 'Month',
                backend    : 'month',
                type       : 'integer'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow',
                type       : 'string'
            }
        },

        ExpensesPayments: {
            supplier: {
                displayName: 'Employee',
                backend    : 'supplier._id'
            },

            year: {
                displayName: 'Year',
                backend    : 'year'
            },

            month: {
                displayName: 'Month',
                backend    : 'month'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow'
            }
        },

        /*DividendPayments: {
         year: {
         displayName: 'Year',
         backend    : 'year'
         },

         month: {
         displayName: 'Month',
         backend    : 'month'
         },

         workflow: {
         displayName: 'Status',
         backend    : 'workflow'
         }
         },*/

        Products: {
            name: {
                displayName: '产品名称',
                backend    : '_id'
            },

            /*productType: {
             displayName: 'Product Type',
             backend    : 'info.productType',
             type       : 'string'
             },*/

            canBeSold: {
                displayName: '可销售',
                backend    : 'canBeSold',
                type       : 'boolean'
            },

            canBeExpensed: {
                displayName: '可领用',
                backend    : 'canBeExpensed',
                type       : 'boolean'
            },

            canBePurchased: {
                displayName: '可采购',
                backend    : 'canBePurchased',
                type       : 'boolean'
            },

            productCategory: {
                displayName: 'Category',
                backend    : 'info.categories'
            },

            array: ['name', 'canBeSold', 'canBeExpensed', 'canBePurchased']
        },

        salesProduct: {
            name: {
                displayName: 'Product Name',
                backend    : '_id'
            },

            productType: {
                displayName: 'Product Type',
                backend    : 'info.productType'
            },

            canBeSold: {
                displayName: 'Can be Sold',
                backend    : 'canBeSold'
            },

            canBeExpensed: {
                displayName: 'Can be Expensed',
                backend    : 'canBeExpensed'
            },

            canBePurchased: {
                displayName: 'Can be Purchased',
                backend    : 'canBePurchased'
            }
        },

        Quotations: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            supplier: {
                displayName: 'Supplier',
                backend    : 'supplier._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            array: ['supplier', 'workflow']
        },

        Invoices: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            supplier: {
                displayName: 'Supplier',
                backend    : 'supplier._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            array: ['supplier', 'workflow']
        },
        
        purchaseInvoices: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            supplier: {
                displayName: '供应商',
                backend    : 'supplier._id'
            },

            workflow: {
                displayName: '状态',
                backend    : 'workflow._id'
            },

            date: {
                type   : 'date',
                backend: {
                    key     : 'invoiceDate',
                    operator: ['$gte', '$lte']
                }
            },

            array: ['supplier', 'workflow']
        },
                                        
        salesQuotations: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            project: {
                displayName: 'Project',
                backend    : 'project._id'
            },

            supplier: {
                displayName: 'Customer',
                backend    : 'supplier._id'
            },

            salesManager: {
                displayName: 'Sales Manager',
                backend    : 'salesManager._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            array: ['project', 'supplier', 'salesManager', 'workflow']
        },

        salesOrders: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            project: {
                displayName: 'Project',
                backend    : 'project._id'
            },

            supplier: {
                displayName: 'Customer',
                backend    : 'supplier._id'
            },

            salesManager: {
                displayName: 'Sales Manager',
                backend    : 'salesManager._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            array: ['project', 'supplier', 'salesManager', 'workflow']
        },

        Orders: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            supplier: {
                displayName: 'Supplier',
                backend    : 'supplier._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            array: ['workflow', 'supplier']
        },
        
        purchaseOrders: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            supplier: {
                displayName: '供应商',
                backend    : 'supplier._id'
            },

            workflow: {
                displayName: '订单状态',
                backend    : 'workflow._id'
            },

            date: {
                type   : 'date',
                backend: {
                    key     : 'orderDate',
                    operator: ['$gte', '$lte']
                }
            },

            array: ['supplier', 'workflow']
        },

        order: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            supplier: {
                displayName: '客户',
                backend    : 'supplier._id'
            },

            salesPerson: {
                displayName: '跟单员',
                backend    : 'salesPerson._id'
            },

            workflow: {
                displayName: '状态',
                backend    : 'workflow._id'
            },

            channel: {
                displayName: 'Channel',
                backend    : 'channel._id'
            },

            name: {
                displayName: '销售订单号',
                backend    : '_id'
            },

            /*name: {
             displayName: 'Reference',
             backend    : 'name',
             type       : 'string'
             },*/

            date: {
                type   : 'date',
                backend: {
                    key     : 'orderDate',
                    operator: ['$gte', '$lte']
                }
            },

            array: ['supplier', 'salesPerson', 'workflow', 'name']
        },

        PayrollExpenses: {
            employee: {
                displayName: 'Employee',
                backend    : 'employee._id'
            },

            type: {
                displayName: 'Payment Type',
                backend    : 'type._id'
            },

            dataKey: {
                displayName: 'Data Key',
                backend    : 'dataKey',
                type       : 'string'
            }
        },

        jobsDashboard: {
            salesManager: {
                displayName: 'Sales Manager',
                backend    : 'salesManager._id'
            },

            project: {
                displayName: 'Project',
                backend    : 'project._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            type: {
                displayName: 'Type',
                backend    : 'type',
                type       : 'string'
            },

            paymentsCount: {
                displayName: 'Payment Count',
                backend    : 'payment.count',
                type       : 'integer'
            }
        },

        salaryReport: {
            employee: {
                displayName: 'Employee',
                backend    : '_id'
            },

            department: {
                displayName: 'Department',
                backend    : 'department._id'
            },

            onlyEmployees: {
                displayName: 'Only Employees',
                backend    : 'onlyEmployees',
                type       : 'boolean'
            },

            array: ['employee', 'department', 'onlyEmployees']
        },
        
        invoiceCharts: {
            dateFilterArray: [
                'custom'
            ]
        },

        trialBalance: {
            dateFilterArray: [
                'thisMonth',
                'thisFinYear',
                'line',
                'lastMonth',
                'lastQuarter',
                'lastFinYear',
                'line',
                'custom'
            ]
        },

        journalEntry: {
            dateFilterArray: [
                'thisMonth',
                'thisFinYear',
                'line',
                'lastMonth',
                'lastQuarter',
                'lastFinYear',
                'line',
                'custom'
            ],

            journal: {
                displayName: 'Journal',
                backend    : 'journal._id'
            },

            name: {
                displayName: 'Source Document',
                backend    : 'sourceDocument.name',
                type       : 'string'
            },

            timestamp: {
                displayName: 'Name',
                backend    : 'timestamp',
                type       : 'string'
            },
       
            debit: {
                backend    : 'debit',
                type       : 'integer'
            },

            credit: {
                backend    : 'credit',
                type       : 'integer'
            },

            account: {
                displayName: 'Account',
                backend    : 'account._id'
            },

            salesManager: {
                backend: 'salesmanager._id'
            },

            project: {
                backend: 'project._id'
            },

            type: {
                backend: 'project.projecttype',
                type   : 'string'
            },
            sum: {
                displayName: 'Debit or Credit Amount',
                backend    : '_id'
            },

            date: {
                type   : 'date',
                backend: {
                    key     : 'date',
                    operator: ['$gte', '$lte']
                }
            },

            _type: {
                backend: '_type',
                type   : 'string'
            },

            array: ['journal', 'name', 'account', 'timestamp', 'sum']
        },
        
        customDashboardCharts: {
            dateFilterArray: [
                'thisMonth',
                'thisFinYear',
                'line',
                'lastMonth',
                'lastQuarter',
                'lastFinYear',
                'line',
                'custom'
            ]
        },
        
        customDashboard: {
            dateFilterArray: [
                 'thisMonth',
                'thisFinYear',
                'line',
                'lastMonth',
                'lastQuarter',
                'lastFinYear',
                'line',
                'custom'               
            ]
        },

        inventoryReport: {
            project: {
                displayName: 'Project',
                backend    : 'project._id'
            },

            salesManager: {
                displayName: 'Sales Manager',
                backend    : 'salesmanager._id'
            },

            type: {
                displayName: 'Project Type',
                backend    : 'project.projecttype',
                type       : 'string'
            },

            date: {
                backend: 'date',
                type   : 'date'
            },

            array: ['project', 'salesManager', 'type']
        },

        projectsDashboard: {
            customer: {
                displayName: 'Customer',
                backend    : 'customer._id'
            },

            name: {
                displayName: 'Project',
                backend    : 'project._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow'
            },

            type: {
                displayName: 'Type',
                backend    : 'type',
                type       : 'string'
            },

            array: ['workflow', 'name', 'customer', 'type']

        },

        manualEntry: {
            dateFilterArray: [
                'thisMonth',
                'thisYear',
                'line',
                'lastMonth',
                'lastQuarter',
                'lastYear',
                'line',
                'custom'
            ]
        },

        cashBook: {
            dateFilterArray: [
                'thisMonth',
                'thisYear',
                'line',
                'lastMonth',
                'lastQuarter',
                'lastYear',
                'line',
                'custom'
            ]
        },

        cashFlow: {
            dateFilterArray: [
                'thisMonth',
                'thisYear',
                'line',
                'lastMonth',
                'lastQuarter',
                'lastYear',
                'line',
                'custom'
            ]
        },

        invoice: {
            forSales: {
                backend: 'forSales',
                type   : 'boolean'
            },

            supplier: {
                displayName: 'Customer',
                backend    : 'supplier._id'
            },

            salesPerson: {
                displayName: 'Assigned',
                backend    : 'salesPerson._id'
            },

            project: {
                displayName: 'Project Name',
                backend    : 'project._id'
            },

            workflow: {
                displayName: 'Status',
                backend    : 'workflow._id'
            },

            date: {
                type   : 'date',
                backend: {
                    key     : 'invoiceDate',
                    operator: ['$gte', '$lte']
                }
            },

            array: ['supplier', 'salesPerson', 'project', 'workflow']
        },
        
        profitAndLoss: {
            dateFilterArray: [
                'thisMonth',
                'thisYear',
                'line',
                'lastMonth',
                'lastQuarter',
                'lastYear',
                'line',
                'custom'
            ]
        },

        projectApproval: {
            name: {
                displayName: '工程名称',
                backend    : 'name',
                type       : 'string',
            },

            customer: {
                displayName: '建设单位',
                backend    : 'customer._id'
            },

            workflow: {
                displayName: '状态',
                backend    : 'workflow._id'
            },

            array: ['name', 'customer', 'workflow']
        },

        WorkOrders: {

            projectName: {
                displayName: '工程名称',
                backend    : 'projectName._id'
            },

            projectManager: {
                displayName: '项目经理',
                backend    : 'projectManager._id'
            },
            array: ['projectName', 'projectManager'] 
        },

        OrderApproval: {

            projectName: {
                displayName: '工程名称',
                backend    : 'projectName._id'
            },

            workNumber: {
                displayName: '制造令号',
                backend    : 'workNumber',
                type       : 'string'
            },
            array: ['projectName', 'workNumber']
        },

        PieceWages: {

            employeeName: {
                displayName: '操作员工',
                backend    : 'employeeName._id'
            },

            empDepartment: {
                displayName: '所在组',
                backend    : 'empDepartment._id'
            }
            
        },

        OrderReckons: {

            projectName: {
                displayName: '工程名称',
                backend    : 'projectName._id'
            },

            workNumber: {
                displayName: '制造令号',
                backend    : 'workNumber',
                type       : 'string'
            },
            array: ['projectName', 'workNumber']    
        },

        designRec: {
            projectName: {
                displayName: '工程名称',
                backend    : 'projectName._id'
            },
            array: ['projectName'] 
        },

        assign: {
            projectName: {
                displayName: '工程名称',
                backend    : 'projectName._id'
            },
            array: ['projectName']
        },

        aluveneerOrders: {
            projectName: {
                displayName: '工程名称',
                backend    : 'projectName._id'
            },
            workNumber: {
                displayName: '订单编号',
                backend    : 'cgdh',
                type       : 'string'
            },
            array: ['projectName', 'workNumber'] 
        },

        buildingContract: {

            projectName: {
                displayName: '工程名称',
                backend    : 'projectName._id'
            },

            customer: {
                displayName: '客户',
                backend    : 'customer._id'
            },
            
            contractNum: {
                displayName: '合同编号',
                backend    : 'contractNum',
                type       : 'string'
            },
            array: ['projectName', 'customer', 'contractNum']
        },

        aluorderApproval: {

            projectName: {
                displayName: '工程名称',
                backend    : 'projectName._id'
            },

            workNumber: {
                displayName: '订单编号',
                backend    : 'cgdh',
                type       : 'string'
            },

            array: ['projectName', 'workNumber']
        },

        fileManagement: {
            name: {
                displayName: '证书名称',
                backend    : 'name',
                type       : 'string'
            },

            status: {
                displayName: '状态',
                backend    : 'status',
                type       : 'string'
            },

            array: ['name', 'status']
        },

        certificateHistory: {
            name: {
                displayName: '证书名称',
                backend    : 'certificate.name',
                type       : 'string'
            },

            array: ['name']
        },

        productBunchType: {
            name: {
                displayName: '类型',
                backend: 'name',
                type: 'string'
            },

            array: ['name']
        },

        productSurfaceTreat: {
            name: {
                displayName: '名称',
                backend: 'name',
                type: 'string'
            },

            array: ['name']
        },

        engineerInfo: {
            name: {
                displayName: '工程名称',
                backend: 'name',
                type: 'string'
            },

            array: ['name']
        },

        managementRule: {
            categoryTex: {
                displayName: '类别',
                backend: 'categoryTex',
                type: 'string'
            },

            array: ['categoryTex']
        },

        safetyManagement: {
            classify: {
                displayName: '控制分类',
                backend: 'classify._id',
            },

            array: ['classify']
        },

        productParameter: {
            name: {
                displayName: '产品名称',
                backend: 'name',
                type: 'string'
            },

            array: ['name']
        },

        socialInsurance: {
            employee: {
                displayName: '员工',
                backend: 'employee',
            },

            department: {
                displayName: '部门',
                backend: 'department'
            },

            array: ['employee', 'department']
        },

        depRoyalty: {
            year: {
                displayName: '年份',
                backend    : 'year',
                type       : 'integer'
            },

            array: ['year']
        },

        royaltyDetails: {
            year: {
                displayName: '年份',
                backend    : 'year',
                type       : 'integer'
            },

            array: ['year']
        },

        ChartOfAccount: {
            category: {
                displayName: 'Category',
                backend    : 'category._id'
            },

            account: {
                displayName: 'Account Name',
                backend    : 'account',
                type       : 'string'
            },

            code    : {
                displayName: 'Code',
                backend    : 'code',
                type       : 'integer'
            },
            currency: {
                displayName: 'Currency',
                backend    : 'payMethod.currency',
                type       : 'string'
            }
        },
        
        accept: {
            acceptType: {
                displayName: '承兑类型',
                backend    : 'acceptType',
                type       : 'string'
            },
            array: ['acceptType']
        },

        building: {
            name: {
                displayName: '工程名称',
                backend    : 'name',
                type       : 'string'
            },
            customerId: {
                displayName: '客户',
                backend    : 'customerId._id'
            },
            projectManager: {
                displayName: '项目经理',
                backend    : 'projectManager',
                type       : 'string'
            },
            array: ['name', 'customerId', 'projectManager']
        },

        produceSchedule: {

            projectId: {
                displayName: '工程名称',
                backend    : 'projectId._id'
            },

            orderNumber: {
                displayName: '订单编号',
                backend    : 'orderNumber',
                type       : 'string'
            },

            produceType: {
                displayName: '生产类型',
                backend    : 'produceType',
                type       : 'string'
            },

            scheduleDate: {
                displayName: '计划日期',
                backend    : 'scheduleDate',
                type       : 'string'
            },
            array: ['projectId', 'orderNumber', 'produceType', 'scheduleDate']
        },

        goodsInNotes: {
            name: {
                displayName: '入库单',
                backend    : '_id'
            },

            order: {
                displayName: '订单号',
                backbend   : 'order._id'
            },

            customer: {
                displayName: '供应商',
                backend    : 'customer._id'
            },

            warehouse: {
                displayName: '仓库',
                backend    : 'warehouse._id'
            },

            status: {
                displayName: '审核状态',
                backend    : 'status.approved',
                type       : 'boolean'
            },

            isValid: {
                displayName: '是否收到发票',
                backend    : 'isValid',
                type       : 'boolean'
            },

            shippinglist: {
                displayName: '码单号',
                backend    : 'shippinglist',
                type       : 'string'
            },

            date: {
                type   : 'date',
                backend: {
                    key     : 'date',
                    operator: ['$gte', '$lte']
                }
            },
            array: ['order', 'warehouse', 'customer', 'name', 'status', 'isValid', 'shippinglist']
        },

        goodsReturn: {

            projectId: {
                displayName: '工程名称',
                backend    : 'projectId._id'
            },

            orderNumber: {
                displayName: '退货单号',
                backend    : 'orderNumber',
                type       : 'string'
            },

            state: {
                displayName: '状态',
                backend    : 'state',
                type       : 'string'
            },

            type: {
                displayName: '类型',
                backend    : 'type',
                type       : 'string'
            },

            array: ['projectId', 'orderNumber', 'state', 'type']
        },

        goodsBarcode: {

            projectId: {
                displayName: '工程名称',
                backend    : 'projectId._id'
            },

            orderNumber: {
                displayName: '退货单号',
                backend    : 'orderNumber',
                type       : 'string'
            },

            deliverNumber: {
                displayName: '发货车次',
                backend    : 'deliverNumber._id'
            },

            array: ['projectId', 'orderNumber', 'deliverNumber']
        },

        goodsScrap: {

            projectId: {
                displayName: '工程名称',
                backend    : 'projectId._id'
            },

            orderNumber: {
                displayName: '报废&返工单号',
                backend    : 'orderNumber',
                type       : 'string'
            },

            deliverNumber: {
                displayName: '发货车次',
                backend    : 'deliverNumber._id'
            },

            array: ['projectId', 'orderNumber', 'deliverNumber']
        },

        oemBarcode: {

            projectId: {
                displayName: '工程名称',
                backend    : 'projectId._id'
            },

            orderNumber: {
                displayName: '退货单号',
                backend    : 'orderNumber',
                type       : 'string'
            },

            deliverNumber: {
                displayName: '发货车次',
                backend    : 'deliverNumber._id'
            },

            array: ['projectId', 'orderNumber', 'deliverNumber']
        },

        oemNotes: {
            building: {
                displayName: '工程名称',
                backend    : 'building._id'
            },

            name: {
                displayName: '单号',
                backend    : 'name',
                type       : 'string'
            },

            reason: {
                displayName: '类型',
                backend    : 'reason',
                type       : 'string'
            },
            array: ['building', 'name', 'reason']
        },

        timeCard: {
            name: {
                displayName: '姓名',
                backend: '_id'
            },

            department: {
                displayName: '部门',
                backend: 'department._id'
            },

            array: ['name', 'department']
        },

        ColorNumber: {
            projectId: {
                displayName: '工程名称',
                backend    : 'projectId._id'
            },

            colorNumber: {
                displayName: '色号',
                backend    : 'colorNumber',
                type       : 'string'
            },

            array: ['projectId', 'colorNumber']
        },

        shippingNote: {
            projectName: {
                displayName: '工程名称',
                backend: 'projectName',
                type: 'string'
            },

            trips: {
                displayName: '车次',
                backend: '_id'
            },

            array: ['projectName', 'trips']
        },

        shippingPlan: {
            projectName: {
                displayName: '工程名称',
                backend: 'projectName',
                type: 'string'
            },

            array: ['projectName']
        },

        shippingFee:{
            ID: {
                displayName: '发货单号',
                backend    : '_id'
            },
            projectName: {
                displayName: '工程名称',
                backend    : 'projectName',
                type: 'string'
            },
            deliverMan: {
                displayName: '运输方',
                backend    : 'deliverMan',
                type: 'string'
            },

            array: ['ID', 'projectName','deliverMan']
        },

        costApportionment: {
            building: {
                displayName: '工程名称',
                backend    : '_id'

            },
            array: ['building'],

            date: {
                type   : 'date',
                backend: {
                    key     : 'date',
                    operator: ['$gte', '$lte']
                }
            },
            scantime: {
                type   : 'date',
                backend: {
                    key     : 'scantime',
                    operator: ['$gte', '$lte']
                }
            }

        },

	oemOutNote: {
            projectName: {
                displayName: '工程名称',
                backend: 'projectName',
                type: 'string'
            },

            trips: {
                displayName: '车次',
                backend: '_id'
            },

            array: ['projectName', 'trips']
        },

        produceMonitoring: {
            projectName: {
                displayName: '工程名称',
                backend    : 'projectName._id'
            },

            orderNumber: {
                displayName: '订单编号',
                backend    : 'orderNumber',
                type       : 'string'
            },

            array: ['projectName', 'orderNumber'],

            day: {
                type   : 'date',
                backend: {
                    key     : 'day',
                    operator: ['$gte', '$lte']
                }
            }
        },

    };

    if (typeof window === 'object' && this === window) {
        root = window;
    } else if (typeof global === 'object' && this === global) {
        root = global;
    } else {
        root = this;
    }

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = FILTERS;
        }
    } else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return FILTERS;
        });
    } else {
        root.FILTERS = FILTERS;
    }
}());
