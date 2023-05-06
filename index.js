const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId  = require("mongodb").ObjectId;

// firebase back end authentication
const admin = require("firebase-admin");
var serviceAccount = require("./practice-jwt.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(express.json());
app.use(cors());
// -------
const uri =
  "mongodb+srv://Israt_Dental:YLPe5II2CN2OGwPx@cluster0.koa7uom.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const database = client.db("hadi");

const person = database.collection("israt");
const authenticateUser=database.collection("user")


// post an appointment. 
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
      console.log(result);
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


// middleware before making an user
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

// make a new admin
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

// app.put('/users/makeAdmin', async (req, res) => {
//   console.log(req.body)
//   res.send()
// })



// Get all the appointments.
app.get("/appointments", (req, res) => {
  async function run() {
    try {
      const query = req.query;
      const cursor = person.find(query);
      const appointments = await cursor.toArray();
      res.send(appointments);
    } catch {
      console.log("failed to write");
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

// don`t know what
app.get("/appointments", async (req, res) => {
  const query = req.query.name;
  const result = await person.findOne(query);
  res.json(result);
});
// For testing. not involved in this app
app.get("/users", async (req, res) => {
  async function run() {
    res.send("hello world");
  }
  run();
});

const PORT = process.env.port || 2020;

app.listen(PORT, () => {
  console.log("Server is listening on port " + PORT);
});
