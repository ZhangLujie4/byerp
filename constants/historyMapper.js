//TODO ?但是应该是存一些history的标识的
module.exports = {
    LEAD: {
        collectionName: 'Opportunities',

        map: {
            isOpportunitie: {
                name : 'isOpportunitie',
                isRef: false
            },
            'createdBy.date' : {
                name : 'Creation Date',
                isRef: false
            },

            'expectedRevenue.value': {
                name : 'expectedRevenue',
                isRef: false
            },
            'expectedClosing': {
                name : 'Close Date',
                isRef: false
            },

            salesPerson: {
                name      : 'salesPerson',
                isRef     : true,
                collection: 'Employees',
                project   : {$concat: ['$tmp.name.first', ' ', '$tmp.name.last']}
            },

            workflow: {
                name      : 'workflow',
                isRef     : true,
                collection: 'workflows',
                project   : '$tmp.name'
            }
        }
    },

    OPPORTUNITIE: {
        collectionName: 'Opportunities',

        map: {
            isOpportunitie: {
                name : 'isOpportunitie',
                isRef: false
            },

            'expectedRevenue.value': {
                name : 'expectedRevenue',
                isRef: false
            },
            'expectedClosing': {
                name : 'Close Date',
                isRef: false
            },
            salesPerson: {
                name      : 'Assigned To',
                isRef     : true,
                collection: 'Employees',
                project   : {$concat: ['$tmp.name.first', ' ', '$tmp.name.last']}
            },
            workflow: {
                name      : 'workflow',
                isRef     : true,
                collection: 'workflows',
                project   : '$tmp.name'
            },
            'createdBy.date' : {
                name : 'Creation Date',
                isRef: false
            }
        }
    },

    INVOICE : {
        collectionName: 'Invoice',

        map: {
            approved: {
                name : 'Approved',
                isRef: false
            },


            workflow: {
                name      : 'Status',
                isRef     : true,
                collection: 'workflows',
                project   : '$tmp.name'
            },
            dueDate: {
                name : 'Due Date',
                isRef: false
            },
            invoiceDate: {
                name : 'Invoice Date',
                isRef: false
            },
            'createdBy.date' : {
                name : 'Creation Date',
                isRef: false
            }
        }
    },
    ORDER : {
        collectionName: 'ORDER',

        map: {
            'status.fulfillStatus': {
                name : 'Fulfilled',
                isRef: false
            },
            orderDate: {
                name : 'Order Date',
                isRef: false
            },
            expectedDate: {
                name : 'Payment Due Date',
                isRef: false
            },
            workflow: {
                name      : 'Status',
                isRef     : true,
                collection: 'workflows',
                project   : '$tmp.name'
            },
            'createdBy.date' : {
                name : 'Creation Date',
                isRef: false
            }
        }
    },
    PERSON : {
        collectionName: 'Persons',

        map: {
            skype: {
                name : 'Skype',
                isRef: false
            },
            'createdBy.date' : {
                name : 'Creation Date',
                isRef: false
            },
            email: {
                name : 'Email',
                isRef: false
            },
            'social.LI': {
                name : 'LinkedIn',
                isRef: false
            },
            'social.FB': {
                name : 'FaceBook',
                isRef: false
            },
            'dateBirth': {
                name : 'Date of Birth',
                isRef: false
            },
            'name.first': {
                name : 'First Name',
                isRef: false
            },
            'name.last': {
                name : 'Last Name',
                isRef: false
            },
            'jobPosition': {
                name : 'Job Position',
                isRef: false
            },
            'address.country': {
                name : 'Country',
                isRef: false
            }
            /*salesPerson: {
                name      : 'Assigned To',
                isRef     : true,
                collection: 'Employees',
                project   : {$concat: ['$tmp.name.first', ' ', '$tmp.name.last']}
            },

            workflow: {
                name      : 'workflow',
                isRef     : true,
                collection: 'workflows',
                project   : '$tmp.name'
            }*/
        }
    },
    COMPANY : {
        collectionName: 'Companies',

        map: {
            email: {
                name : 'Email',
                isRef: false
            },
            'social.LI': {
                name : 'LinkedIn',
                isRef: false
            },
            'website': {
                name : 'Website',
                isRef: false
            },
            'social.FB': {
                name : 'FaceBook',
                isRef: false
            },
            'name.first': {
                name : 'Name',
                isRef: false
            },
            'address.country': {
                name : 'Country',
                isRef: false
            },
            'salesPurchases.salesPerson': {
                name      : 'Assigned To',
                isRef     : true,
                collection: 'Employees',
                project   : {$concat: ['$tmp.name.first', ' ', '$tmp.name.last']}
            },
            'createdBy.date' : {
                name : 'Creation Date',
                isRef: false
            }
        }
    },
    DEALTASK : {
        collectionName: 'DealTasks',

        map: {
            'description': {
                name : 'Description',
                isRef: false
            },
            assignedTo: {
                name      : 'Assigned To',
                isRef     : true,
                collection: 'Employees',
                project   : {$concat: ['$tmp.name.first', ' ', '$tmp.name.last']}
            },
            'workflow': {
                name      : 'Stage',
                isRef     : true,
                collection: 'workflows',
                project   : '$tmp.name'
            },
            'createdBy.date' : {
                name : 'Creation Date',
                isRef: false
            }
        }
    },
    DESIGNROYALTY:{
        collectionName: 'designRoyalty',
        map: {
            'persons': {
                name : 'persons',
                isRef: false
            }
        }
    },
    ACCEPT:{
        collectionName: 'accept',
        map: {
            'acceptDate': {
                name : 'acceptDate',
                isRef: false
            },
            'amount': {
                name : 'amount',
                isRef: false
            },
            'acceptMan': {
                name : 'acceptMan',
                isRef: false
            },
            'payDepartment': {
                name : 'payDepartment',
                isRef: false
            },
            'Department': {
                name : 'Department',
                isRef: false
            },
            'endDate': {
                name : 'endDate',
                isRef: false
            },'acceptNumber': {
                name : 'acceptNumber',
                isRef: false
            },
            'payBank': {
                name : 'payBank',
                isRef: false
            },
            'receiveMan': {
                name : 'receiveMan',
                isRef: false
            },
            'note': {
                name : 'note',
                isRef: false
            },
            'payDate': {
                name : 'payDate',
                isRef: false
            },
            'acceptType': {
                name : 'acceptType',
                isRef: false
            }

        }
    },

    cashDeposit:{
        collectionName: 'cashDeposit',
        map: {
            'department': {
                name : 'department',
                isRef     : true,
                collection: 'Department',
                project   : '$tmp.name'
            },
            'project': {
                name : 'project',
                isRef     : true,
                collection: 'Project',
                project   : '$tmp.name'
            },
            'pmr': {
                name : 'persons',
                isRef     : true,
                collection: 'Employees',
                project   : {$concat: ['$tmp.name.first', ' ', '$tmp.name.last']}
            },
            'enterprise': {
                name : 'persons',
                isRef     : true,
                collection: 'enterprise',
                project   : '$tmp.name'
            },
            'type': {
                name : 'type',
                isRef: false
            },
            'description': {
                name : 'description',
                isRef: false
            },'endDate': {
                name : 'endDate',
                isRef: false
            },
            'companyProject': {
                name : 'companyProject',
                isRef: false
            },
            'applyDate': {
                name : 'applyDate',
                isRef: false
            },
            'amount': {
                name : 'amount',
                isRef: false
            },
            'openDate': {
                name : 'openDate',
                isRef: false
            },
            'payDate': {
                name : 'payDate',
                isRef: false
            },
            'paymentMethod': {
                name : 'paymentMethod',
                isRef: false
            },
            'pmrAmount': {
                name : 'pmrAmount',
                isRef: false
            },
            'cash': {
                name : 'cash',
                isRef: false
            },
            'projectAmount': {
                name : 'projectAmount',
                isRef: false
            },
            'unPay': {
                name : 'unPay',
                isRef: false
            },
            'loanAgreement': {
                name : 'loanAgreement',
                isRef: false
            },
            'depositType': {
                name : 'depositType',
                isRef: false
            },
            'flow': {
                name : 'flow',
                isRef: false
            }

        }
    },

    cashJournal:{
        collectionName: 'cashJournal',
        map: {
            'journal': {
                name : 'journal',
                isRef     : true,
                collection: 'Department',
                project   : '$tmp.name'
            },
            'debitAccount': {
                name : 'debitAccount',
                isRef     : true,
                collection: 'Project',
                project   : '$tmp.name'
            },
            'creditAccount': {
                name : 'creditAccount',
                isRef     : true,
                collection: 'Employees',
                project   : {$concat: ['$tmp.name.first', ' ', '$tmp.name.last']}
            },
            'debit': {
                name : 'debit',
                isRef     : true,
                collection: 'enterprise',
                project   : '$tmp.name'
            },
            'credit': {
                name : 'credit',
                isRef: false
            },
            'amount': {
                name : 'amount',
                isRef: false
            },'date': {
                name : 'date',
                isRef: false
            },
            'abstract': {
                name : 'abstract',
                isRef: false
            }
        }
    },
    DESIGNREC : {
        collectionName: 'designRec',

        map: {
            orderNumber: {
                name : 'orderNumber',
                isRef: false
            },
            protectType: {
                name      : 'protectType',
                isRef     : false
            },
            acreage: {
                name      : 'acreage',
                isRef     : false
            },
            arrivalDate: {
                name      : 'arrivalDate',
                isRef     : false
            },
            comment: {
                name      : 'comment',
                isRef     : false
            },
            orderMaterial: {
                name      : 'orderMaterial',
                isRef     : false
            },
            isReview: {
                name      : 'isReview',
                isRef     : false
            },
            designDays: {
                name      : 'isReview',
                isRef     : false
            },
            designer: {
                name      : 'designer',
                isRef     : true,
                collection: 'Employees',
                project   : {$concat: ['$tmp.name.first', ' ', '$tmp.name.last']}
            },
        }
    },
    CHARGEITEMS : {
        collectionName: 'chargeItems',

        map: {
            chargeItem: {
                name      : 'chargeItem',
                isRef     : false
            },
            unit: {
                name      : 'unit',
                isRef     : false
            },
            price: {
                name      : 'price',
                isRef     : false
            },
            code: {
                name      : 'code',
                isRef     : false
            },
        }
    },
    PROCESSCONTENTS : {
        collectionName: 'processContents',

        map: {
            processContent: {
                name      : 'processContent',
                isRef     : false
            },
            unit: {
                name      : 'unit',
                isRef     : false
            },
            price: {
                name      : 'price',
                isRef     : false
            },
            processType: {
                name      : 'processType',
                isRef     : false
            },
            code: {
                name      : 'code',
                isRef     : false
            },
        }
    },
    WORKORDERS : {
        collectionName: 'workOrders',

        map: {
            workNumber: {
                name      : 'workNumber',
                isRef     : false
            },
            processGroup: {
                name      : 'processGroup',
                isRef     : false
            },
            operatorNumber: {
                name      : 'operatorNumber',
                isRef     : false
            },
            chargeItems: {
                name      : 'chargeItems',
                isRef     : false
            },
            processContents: {
                name      : 'processContents',
                isRef     : false
            },
        }
    },
    BUILDINGCONTRACT : {
        collectionName: 'buildingContract',

        map: {
            customerPhone: {
                name      : 'customerPhone',
                isRef     : false
            },
            managerPhone: {
                name      : 'managerPhone',
                isRef     : false
            },
            clerkRate: {
                name      : 'clerkRate',
                isRef     : false
            },
            merchandiserRate: {
                name      : 'merchandiserRate',
                isRef     : false
            },
            consigneePhone: {
                name      : 'consigneePhone',
                isRef     : false
            },
            clerkRate1: {
                name      : 'clerkRate1',
                isRef     : false
            },
            clerkRate2: {
                name      : 'clerkRate2',
                isRef     : false
            },
            clerkRate3: {
                name      : 'clerkRate3',
                isRef     : false
            },
            merchandiserRate1: {
                name      : 'merchandiserRate1',
                isRef     : false
            },
            merchandiserRate2: {
                name      : 'merchandiserRate2',
                isRef     : false
            },
            merchandiserRate3: {
                name      : 'merchandiserRate3',
                isRef     : false
            },
            projectCost: {
                name      : 'projectCost',
                isRef     : false
            },
            projectQuantity: {
                name      : 'projectQuantity',
                isRef     : false
            },
            minArea: {
                name      : 'minArea',
                isRef     : false
            },
            payRate1: {
                name      : 'payRate1',
                isRef     : false
            },
            payRate2: {
                name      : 'payRate2',
                isRef     : false
            },
            payRate3: {
                name      : 'payRate3',
                isRef     : false
            },
            payRate4: {
                name      : 'payRate4',
                isRef     : false
            },
            payRate5: {
                name      : 'payRate5',
                isRef     : false
            },
            payRate6: {
                name      : 'payRate6',
                isRef     : false
            },
            payRate7: {
                name      : 'payRate7',
                isRef     : false
            },
        }
    },
    BUILDING : {
        collectionName: 'building',

        map: {
            name: {
                name      : 'name',
                isRef     : false
            },
            projectManager: {
                name      : 'projectManager',
                isRef     : false
            },
            customerId: {
                name      : 'customerId',
                isRef     : true,
                collection: 'Customers',
                project   : {$concat: ['$tmp.name.first', ' ', '$tmp.name.last']}
            },
        }
    },
    COLORNUMBER : {
        collectionName: 'colorNumber',

        map: {
            colorNumber: {
                name      : 'colorNumber',
                isRef     : false
            },
            colorCode: {
                name      : 'colorCode',
                isRef     : false
            }
        }
    }

};
