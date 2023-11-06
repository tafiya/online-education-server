const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const cors= require('cors');
require('dotenv').config()
const port =process.env.PORT || 5000
//middleware
app.use(cors());
app.use(express.json());


console.log(process.env.DB_PASS)
 


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bescutn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

const assignmentCollections = client.db("assignmentDB").collection("assignments");

app.post('/createAssignment',async(req,res)=>{
    const  newAssignments= req.body;

    const result= await assignmentCollections.insertOne(newAssignments);
    res.send(result);
})



// app.get('/createAssignment',async(req,res)=>{
//     // const cursor =productCollections.find();
//     // const result =await cursor.toArray();
//     res.send('it is working');
// })

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})