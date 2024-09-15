const { model, Schema } = require('mongoose')

const payment = new Schema({
    userId: {
        type: Number,
    },
    amount: {
        type: Number,
    },
    trxID: {
        type: String,
    },
    paymentID: {
        type: String,
    },
    statusMessage: {
        type: String,
    },
    date: {
        type: String,
    },
    transactionStatus: {
        type: String,
    },
    currency: {
        type: String,
    },
    merchantInvoiceNumber: {
        type: String,
    },
    customerMsisdn: {
        type: String,
    },
    userEmail: {
        type: String,
    },
    payerReference: {
        type: String
    }
}, { timestamps: true })

module.exports = model('payments', payment)