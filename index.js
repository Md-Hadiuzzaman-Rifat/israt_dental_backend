const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId  = require("mongodb").ObjectId;

app.use(express.json());
app.use(cors());

const uri =
  "mongodb+srv://Israt_Dental:YLPe5II2CN2OGwPx@cluster0.koa7uom.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const database = client.db("hadi");
const person = database.collection("israt");

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

// payment of booking search by id
app.get("/appointment/bookingPayment/:id", (req, res) => {
  async function run() {
    const _id=new ObjectId(req.params.id)
  
    const result= await person.findOne({_id})
    res.send(result)
  }
  run();
});

app.get("/appointments", async (req, res) => {
  const query = req.query.name;
  const result = await person.findOne(query);
  res.json(result);
});

app.get("/users", async (req, res) => {
  async function run() {
    res.send("hello world");
  }
  run();
});

app.post("/users", async (req, res) => {
  async function run() {
    try {
      const user = req.body;
      const result = await person.insertOne(user);
      console.log(result);
      res.json(result);
    } catch {
      console.log("failed to write user");
    }
  }
  run();
});

app.put("/users", async (req, res) => {
  async function run() {
    try {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await person.updateOne(filter, updateDoc, options);
      res.json(result);
    } catch {
      console.log("failed to update user");
    }
  }
});

const PORT = process.env.port || 2020;

app.listen(PORT, () => {
  console.log("Server is listening on port " + PORT);
});
