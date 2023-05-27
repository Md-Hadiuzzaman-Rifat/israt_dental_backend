const express = require("express");
const app = express();
const cors = require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId  = require("mongodb").ObjectId;
const fileUpload = require('express-fileupload');
const stripe = require('stripe')(process.env.PAYMENT_STRIPE);


// firebase back end authentication
const admin = require("firebase-admin");
var serviceAccount = require("./practice-jwt.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


app.use(express.json());
app.use(cors());
app.use(fileUpload());

// -------
const uri =process.env.MONGODB_URL;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Database name
const database = client.db("hadi");

// collection List
const person = database.collection("schedule");
const authenticateUser=database.collection("user")
const doctorsCollection=database.collection("doctor")
const paymentDetails=database.collection("payment")

// Add New Doctor
app.post("/dashboard/addDoctor",async(req,res)=>{

  const name = req.body.name;
            const email = req.body.email;
            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const doctor = {
                name,
                email,
                image: imageBuffer
            }
            const result = await doctorsCollection.insertOne(doctor);
            res.json(result);
})

// Write an appointment. 
app.post("/appointments", (req, res) => {
  async function run() {
    try {
      const body = req.body;
      const result = person.insertOne(body);
      res.send(result);
    } catch {
      console.log("failed to write");
    }
  }
  run();
});

// A person cant authenticate 2 time using same email.
// This is post method
app.post("/users", async (req, res) => {
    try {
      const user = req.body;
      const result = await authenticateUser.insertOne(user);
      res.json(result);
    } catch {
      console.log("failed to write user");
    }
});

// A person cant authenticate 2 time using same email.
// Put method.
app.put("/users", async (req, res) => {
    try {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await authenticateUser.updateOne(filter, updateDoc, options);
      res.json(result);
    } catch {
      console.log("failed to update user");
    }
});

// checking, is the user is authorized or not
app.get("/users/makeAdmin/:emailId",async (req,res)=>{
  const email=req.params.emailId
  const query = {email: email}
  const user=await authenticateUser.findOne(query)
  let isAdmin = false 
  if(user?.role==="admin"){
    isAdmin = true 
  }
  res.json({admin: isAdmin})
})

// find all doctors
app.get('/doctors', async (req, res) => {
  const cursor = doctorsCollection.find({});
  const doctors = await cursor.toArray();
  res.json(doctors);
});

// middleware for jwt before making an admin
async function verifyToken(req,res,next){
  if (req.headers?.authorization?.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];
    console.log(token)
    try{
      console.log("in verify try block")
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail=  decodedUser.email
    }
    catch{

    }
  }
  next()
}

// make a new admin using jwt
app.put("/users/makeAdmin", verifyToken, async (req,res)=>{
  const user=req.body 
  const requester= req.decodedEmail
console.log(requester)
console.log(req.body)

  if(requester){
    const requesterAccount = await authenticateUser.findOne({email: requester})
    if(requesterAccount.role === "admin"){
      const filter = {email: user.email} 
      console.log(filter)
      const updateDoc={$set:{role:'admin'}}

      const result =await authenticateUser.updateOne(filter, updateDoc)
      res.json(result)
    }else{
      res.status(403).json({message:"You dont have the request"})
    }
  }
})

// Get all the appointments.
app.get("/appointments", (req, res) => {
  async function run() {
    try {
      const query = req.query;
      const cursor = person.find(query);
      const appointments = await cursor.toArray();
      res.send(appointments);
    } catch {
      // console.log("failed to write");
    }
  }
  run();
});

// Payment of booking search by id
app.get("/appointment/bookingPayment/:id", (req, res) => {
  async function run() {
    const _id=new ObjectId(req.params.id)
  
    const result= await person.findOne({_id})
    res.send(result)
  }
  run();
});

// For testing. not involved in this app
app.get("/users", async (req, res) => {
  async function run() {
    res.send("hello world");
  }
  run();
});

// create payment intent
app.post('/create-payment-intent', async (req, res) => {
  const paymentInfo = req.body;
  const amount = paymentInfo.fee
  // await paymentDetails.insertOne(req.body)
  const paymentIntent = await stripe.paymentIntents.create({
      currency: 'usd',
      amount: amount*100,
      payment_method_types: ['card']
  });
  res.json({ clientSecret: paymentIntent.client_secret })
})


// app.put('/appointments/:id', async (req, res) => {
//   const id = req.params.id;
//   const {payment} = req.body;
//   const _id=new ObjectId(req.params.id)
//   const filter=await person.findOne(_id)
//   const updateDoc = {
//       $set: {
//           payment: payment
//       }
//   };
//   const result = await appointmentsCollection.updateOne(filter, updateDoc);
//   res.json("clicked"+result);
//   res.send()
// });


const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log("Server is listening on port " + PORT);
});
