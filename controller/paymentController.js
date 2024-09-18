const axios = require('axios')
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");


const paymentModel = require('../model/paymentModel')
const globals = require('node-global-storage')
const { v4: uuidv4 } = require('uuid')


const client = new MongoClient(process.env.db_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });



const payments = client.db("bkash-node-react").collection("payments")
class paymentController {

    bkash_headers = async () => {
        return {
            "Content-Type": "application/json",
            Accept: "application/json",
            authorization: globals.get('id_token'),
            'x-app-key': process.env.bkash_api_key,
        }
    }

    payment_create = async (req, res) => {
        console.log("payment create: ",req.body)

        const { amount, userId, email, payerReference } = req.body
        console.log("email: ",email)
        console.log("req body", req.body)

        globals.set('userId', userId)
        globals.set('email', email)
        try {
            const { data } = await axios.post(process.env.bkash_create_payment_url, {
                mode: '0011',
                payerReference: payerReference,
                callbackURL: 'https://visa-processing-backend.vercel.app/api/bkash/payment/callback',
                amount: amount,
                currency: "BDT",
                intent: 'sale',
                merchantInvoiceNumber: 'Inv' + uuidv4().substring(0, 5),
                email: email

            }, {
                headers: await this.bkash_headers()
            })
            // console.log(data) 
            return res.status(200).json({ bkashURL: data.bkashURL })
        } catch (error) {
            return res.status(401).json({ error: error.message })
        }

    }

    

    call_back = async (req, res) => {
        const { paymentID, status } = req.query
        console.log("req.query: ",req.query)


        if (status === 'cancel' || status === 'failure') {
            console.log(req.query) // fail status
            return res.redirect(`https://globalvisaprocessing.vercel.app/fail?message=${status}`)
            
        }
        
        if (status === 'success') {
            try {
                const { data } = await axios.post(process.env.bkash_execute_payment_url, { paymentID }, {
                    headers: await this.bkash_headers()
                })

               
              
                               
                console.log("line 81 ", data)
                if (data && data.statusCode === '0000') {
                    await new Promise(resolve => setTimeout(resolve, 500))
                    console.log("paymentID, req query, and email:", paymentID, req.query, req.body);
                    //const userId = globals.get('userId')
                    await paymentModel.create({
                        userId: Math.round(Math.random() * 99999 + 1) ,
                        paymentID,
                        trxID: data.trxID,
                        date: data.paymentExecuteTime,
                        amount: parseInt(data.amount),
                        statusMessage: data.statusMessage,
                        payerReference: data.payerReference
                       
                    })
                    
                    // mongodb cloud
                    await payments.insertOne({
                        userId: Math.round(Math.random() * 99999 + 1) ,
                        paymentID,
                        trxID: data.trxID,
                        date: data.paymentExecuteTime,
                        amount: parseInt(data.amount),
                        statusMessage: data.statusMessage,
                        transactionStatus: data.transactionStatus,
                        currency: data.currency,
                        merchantInvoiceNumber: data.merchantInvoiceNumber,
                        customerMsisdn: data.customerMsisdn,
                        payerReference: data.payerReference
                    })

                    // Get the _id of the inserted document
                    const mongoId = payments.insertedId.toString()

                    return res.redirect(`https://globalvisaprocessing.vercel.app/success/${mongoId}`)
                }else{
                    console.log(data)
                    return res.redirect(`https://globalvisaprocessing.vercel.app/fail?message=${data.statusMessage}`)
                }
            } catch (error) {
                console.log(error)
                return res.redirect(`https://globalvisaprocessing.vercel.app/fail?message=${error.message}`)
            }
        }
    }

    refund = async(req,res)=>{
        const {trxID} = req.params;

        try {
            const payment = await paymentModel.findOne({trxID})

            const {data} = await axios.post(process.env.bkash_refund_transaction_url,{
                paymentID : payment.paymentID,
                amount : payment.amount,
                trxID,
                sku : 'payment',
                reason : 'cashback'
            },{
                headers: await this.bkash_headers()
            })
            if (data && data.statusCode === '0000') {
                return res.status(200).json({message : 'refund success'})
            }else{
                return res.status(404).json({error : 'refund failed'})
            }
        } catch (error) {
            return res.status(404).json({error : 'refund failed'})
        }
    }
}

module.exports = new paymentController()

