const express = require('express');
const {MongoClient}=require('mongodb')
const bodyparser=require('body-parser')
var cors = require('cors')
const jwt = require ('jsonwebtoken')
const cookieParser = require('cookie-parser')
const dotenv=require('dotenv')


const url='mongodb+srv://adityakunwar1527:JY3KlxBqWc7occtl@cluster0.w7fp17w.mongodb.net'
const client=new MongoClient(url)
const dbname='passop';
dotenv.config()
const app=express()
const port = process.env.PORT || 3000;
// Middleware to parse JSON bodies
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:["https://bookmyguide.netlify.app","http://localhost:5173"],
    credentials:true
}))
app.use(bodyparser.json());

client.connect()

// Define a route for the root URL ("/")
app.get('/', async (req, res) => {
    const db=client.db(dbname)
    const collection=db.collection('documents')
    const finalresult= await collection.find({}).toArray();
     //JSON.stringify(finalresult)
    res.json(finalresult);
});

app.post('/search',  async(req, res) => {
    const {location}=req.body;
    const db=client.db(dbname)
    const collection=db.collection('documents')
    const finalresult= await collection.find({location:location}).toArray()
     //JSON.stringify(finalresult)
    res.json(finalresult);
});

app.post('/login', async(req,res)=>{
    const {email,password}=req.body;
    const db=client.db(dbname)
    const collection=db.collection('documents')
    const finalresult= await collection.findOne({email: email})
    .then(user=>{
        // console.log(user)
        if(user){
            if(user.password==password){
               const token=jwt.sign({email: user.email},"jwt-token-secret-key",{expiresIn:'10m'})
               res.cookie('token', token,
                {
                    httpOnly: true,
                    maxAge: 60 * 10 * 1000,
                    secure: process.env.NODE_ENV !== 'development',
                    sameSite: 'lax'
                }
            ) //httpsOnly - true -js cannot access token
               //console.log(token)
               return res.json({user})
              
            }else{
                res.json("incorrect password")
            }
        }
        else{
            res.json("no recored found")
        }
    })
})

//user register
app.post('/testing', async (req, res) => {
    const password=req.body
    const db=client.db(dbname)
    const collection=db.collection('documents')
    const user= await collection.findOne({email: password.email})
    //console.log(user)
    if(!user){
        const finalresult= await collection.insertOne(password)
        res.json("registered successfully")
        //res.send(req.body);
    }
    else{
        res.json("already");
    }
    // .then(async(user)=>{
    //     if(user){
    //         if(user.email==password.email){
    //             res.json("already");
    //         }
           
    //     }
    //     else{
    //         res.json("registered successfully")
    //         const finalresult= await collection.insertOne(password)
    //         res.send(req.body);
    //     }
       
    // })
    // .catch(async(error) => {
    //     console.log("error hai yahan")
    //     const finalresult= await collection.insertOne(password)
    //     res.send(req.body);

    //   });
});


app.post('/guideregister', async (req, res) => {
    const data=req.body 

    const db=client.db(dbname)
    const collection=db.collection('documents')
    const temp= await collection.findOne({email: data.email})
    .then(async(user)=>{
        if(user){
            res.json("already")
        }
        else{
            const finalresult= await collection.insertOne(req.body)
            res.send(req.body);  
        }
    })
    .catch(async(error) => {
        const finalresult= await collection.insertOne(password)
    
        res.send(req.body);

      });
       
});
// middleware token user
const varifyUser=(req,res,next)=>{
    const atoken=req.cookies.token;
    console.log("i run")
    if(!atoken){
      
      res.json("Expired Token")
    }else{
        jwt.verify(atoken,"jwt-token-secret-key",(err,decoded)=>{
            if(err){                
            return res.json({valid: false, message:"Invalid Token"})
            }
            else{
                req.email=decoded.email
                next()
            }
        })
    }
}

app.get('/home',varifyUser,(req,res)=>{
     res.json({valid:true, message:"authorized"})
})

app.get('/logout',(req,res)=>{
res.clearCookie('token');
res.json({status:true})
})


app.post('/book',async(req,res)=>{
    const data=req.body 
   // console.log(data)  
   const guide=data.e;
   const customer=data.userdata
   const date=data.date
   //console.log(date.date)  
    const db=client.db(dbname)
    const collection=db.collection('documents')
    const temp= await collection.findOne({email: guide.email})
    //console.log(temp.booking,"tam temP")
    let finalresult,finalresult1;
    if(temp.customers==undefined){
        
         finalresult= await collection.updateOne(
            { email: temp.email },
            { $set: { "customers": [{"email": customer.email, "name":customer.name ,"payment":"pending","date":date.date }]} }
          )       
    }
    else{
       
         finalresult= await collection.updateOne(
            { email: temp.email },
            { $addToSet: { customers: {"email": customer.email, "name":customer.name ,"payment":"pending","date":date.date }} }
          ) 
    }
    const tempc= await collection.findOne({email: customer.email})
    if(tempc.bookings==undefined){
         finalresult1= await collection.updateOne(
            { email: tempc.email },
            { $set: { "bookings": [{"email": guide.email, "name":guide.name,"date":date.date  ,"location":guide.location,"rate":guide.rate,"payment":"pending"}]} }
          )       
    }
    else{
      
         finalresult1= await collection.updateOne(
            { email: tempc.email },
            { $addToSet: { bookings: {"email": guide.email, "name":guide.name,"date":date.date  ,"location":guide.location,"rate":guide.rate,"payment":"pending"}} }
          ) 
    }
    const customerdata= await collection.findOne({email: customer.email})
   // console.log(customerdata) 
    res.send(customerdata) 
})

//mark as done

app.post('/delete',async(req,res)=>{
    const {e,profiledata}=req.body
   // console.log(e.email,"sapce",profiledata)
    const db=client.db(dbname)
    const collection=db.collection('documents')
   
   const finalresult1= await collection.updateOne(
        { email: profiledata.email },
        { $pull: { customers: {email: e.email}} }
      ) 
      const temp= await collection.findOne({email: e.email})
      // console.log("temp ",temp)
    const  finalresult= await collection.updateOne(
        { email: temp.email },
        { $pull: { bookings: {email: profiledata.email }} }
      ) 


       await collection.updateOne(
        { email: e.email },
        { $pull: { customers: {email: profiledata.email}} }
      ) 
      
      // console.log("temp ",temp)
     await collection.updateOne(
        { email: profiledata.email },
        { $pull: { bookings: {email: e.email }} }
      ) 
      const t= await collection.findOne({email: e.email})
     console.log("i am final",t)
   res.json("deleted")
})

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
