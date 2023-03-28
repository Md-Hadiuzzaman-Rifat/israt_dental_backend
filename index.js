const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { application } = require("express");
app.use(express.json());
app.use(cors());

const uri =
  "mongodb+srv://Israt_Dental:YLPe5II2CN2OGwPx@cluster0.koa7uom.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.post("/appointments", (req, res) => {
  async function run() {
    try {
      const database = client.db("hadi");
      const person = database.collection("israt");
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
      const database = client.db("hadi");
      const person = database.collection("israt");
      const query=req.query
      const cursor = person.find(query);
      const appointments = await cursor.toArray();
      res.send(appointments)
    } catch {
      console.log("failed to write");
    }
  }
  run();
});

const PORT = process.env.port || 2020;

app.listen(PORT, () => {
  console.log("Server is listening on port " + PORT);
});
