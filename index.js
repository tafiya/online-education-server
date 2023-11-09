const express = require('express')
const cookieParser=require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cors= require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const port =process.env.PORT || 5000;
//middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials:true,
  }));
app.use(express.json());
app.use(cookieParser());



 


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bescutn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
//personal middlewares
const logger= async(req,res,next)=>{
    console.log('called booking:',req.method, req.url);
    next();
  }
  
  const verifyToken =async(req,res,next)=>{
    const token=req.cookies?.NewToken;
    console.log('value of token in middleware',token)
    if(!token){
      return res.status(401).send({message:'not authorized'})
    }
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
      if(err)
      {
        console.log(err)
        return res.status(401).send({message:'unauthorized'})
      }
      console.log('value in the token',decoded)
      req.user =decoded;
      next();
    })
    
  
  }
  

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
const submitAssignments = client.db("assignmentDB").collection("submitAssignments");
//----------------auth related Api
app.post('/jwt',logger,async(req,res)=>{
    const user =req.body;
    console.log('use for token',user);
    const token= jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
  
  
    res.cookie('NewToken',token,{
      httpOnly:true ,
      secure :true,
      sameSite: 'none'
    })
   .send({success:true});
  })
  app.post('/logout',async(req,res)=>{
    const user =req.body;
    console.log('logging out',user);
    res.clearCookie('NewToken',{maxAge:0}).send({success:true});
  })
//assignment related api
app.get('/assignments',async(req,res)=>{
    const cursor =assignmentCollections.find();
    const result =await cursor.toArray();
    res.send(result);
})
app.get('/assignments/:id',async(req,res)=>{
    const id=req.params.id;
    const query ={_id: new ObjectId(id)}
    const result =await assignmentCollections.findOne(query);
    res.send(result);
})
// app.get('/submitAssignment',logger,verifyToken,async(req,res)=>{
//   let query={};
//   if(req.query?.status=='pending')
//   {
//       query={status:req.query.status}
//   }
//   const cursor =submitAssignments.find(query);
//   const result =await cursor.toArray();
//   res.send(result);
// })
app.get('/submitAssignment',logger,verifyToken,async(req,res)=>{
  //console.log(req.query.email);
   console.log('User of token', req.user)
  //  console.log('user in from valid token',req.user)
  //  if(req.user.email !== req.query.email )
  //  {
  //   return res.status(403).send({message:'forbidden access'})
  //  }
      let query={};
    if(req.query?.email)
    {
      if(req.user.email !== req.query.email )
      {
       return res.status(403).send({message:'forbidden access'})
      }
        query={email:req.query.email}
    }
    const result= await submitAssignments.find(query).toArray();
    res.send(result);

})
app.post('/createAssignment',async(req,res)=>{
    const  newAssignments= req.body;

    const result= await assignmentCollections.insertOne(newAssignments);
    res.send(result);
})

//submit Assignment
app.post('/submitAssignment',async(req,res)=>{
  const  newSubmit= req.body;
  const result= await submitAssignments.insertOne(newSubmit);
  res.send(result);
  console.log(result);
})
app.patch('/submitAssignment/:id',async(req,res)=>{
  const id =req.params.id;
  const filter ={ _id: new ObjectId(id)};
  const updatedBooking =req.body;
  console.log(updatedBooking);
  const updateDoc ={
      $set:{
          status:updatedBooking.status
      },
  };
  const result =await submitAssignments.updateOne(filter,updateDoc);
  res.send(result);
});

//Update
app.put('/assignments/:id', async(req,res)=>{
    const id =req.params.id;
    console.log(id);
    const filter={_id: new ObjectId(id)};
    const options = { upsert: true };
    const updatedProduct=req.body;
    const newUpdatedProduct={
        $set: {
            title:updatedProduct.title ,
            level:updatedProduct. level ,
            marks:updatedProduct.marks, 
            description:updatedProduct.description ,
            date:updatedProduct.date,
            creatorEmail:updatedProduct.creatorEmail, 
            photo:updatedProduct.photo
          },
    }
    const result= await assignmentCollections.updateOne(filter,newUpdatedProduct,options);
    res.send(result);
})
app.delete('/deleteAssignment/:id',async(req,res)=>{
    const id=req.params.id;
    const query ={_id: new ObjectId(id)}
    const result=await assignmentCollections.deleteOne(query);
    res.send(result)
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