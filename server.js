const express = require('express')
const mongoose = require('mongoose')
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const body_parser = require('body-parser')
const dotEnv = require('dotenv')
const cors = require('cors')




const app = express()


app.use(cors({
    origin: 'https://globalvisaprocessing.vercel.app',
    credentials: true
}))



dotEnv.config()
app.use(body_parser.json())

app.use('/api', require('./routes/routes'))

const client = new MongoClient(process.env.db_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });

const db = async()=>{
    try {
        await mongoose.connect(process.env.db_url)
        await client.connect();
        console.log('db connect')
    } catch (error) {
        
    }
}
db()


const payments = client.db("bkash-node-react").collection("payments")
const userPaymentDetails = client.db("bkash-node-react").collection("userPaymentDetails")
const port = process.env.PORT

app.get('/', (req, res) => res.send('server is running'))

app.get("/payments", async (req, res) => {
    try {
      const query = {};
      const result = await payments.find(query).toArray();
      res.send(result);
    } catch (error) {
      console.log(error, error.message);
    }
  });

app.post('/user-payment-details',async (req, res) => {
    try {
        const userData = req.body
        const result  = await userPaymentDetails.insertOne(userData)
        console.log(userData)
        console.log(result)
        res.send(result)
    }
    catch (error) {
        console.log(error.name, error.message)
    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))