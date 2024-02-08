const http = require("http");
const path = require("path");
const bodyParser = require("body-parser");
const express = require('express'); // Import Express
const portNumber = 7823; 
const fs = require('fs');
const app = express(); // Create an Express app

app.use(bodyParser.urlencoded({extended:false}));

process.stdin.setEncoding("utf8");

require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 

console.log(`Web server started and running at http://localhost:${portNumber}`);
const prompt = "Type stop to shutdown the server: ";
process.stdout.write(prompt);

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

/*Mong DB*/
const userName = process.env.MONGO_DB_USERNAME; 
const password = process.env.MONGO_DB_PASSWORD; 
const database = process.env.MONGO_DB_NAME; 
const collect = process.env.MONGO_COLLECTION; 

const uri = `mongodb+srv://${userName}:${password}@cluster0.yl2utct.mongodb.net/?retryWrites=true&w=majority`; 
const databaseAndCollection = {db: database, collection: collect};
const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


/*homepage*/
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/logedIn', async(req, res) => {
  let firstName = req.body.firstName; 
  let lastName = req.body.lastName; 
  let uid = req.body.uid; 

  /*Adds students to database*/
  try {
    await client.connect();
    const userByUid = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne({ uid: uid });

    if (userByUid) {
      await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).updateOne({ uid: uid }, { $inc: { attendance: 1 } });
    } else {
      const userByFullName = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne({ firstName: firstName.toUpperCase(), lastName: lastName.toUpperCase() });
     
      if (userByFullName) {
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).updateOne({ firstName: firstName.toUpperCase(), lastName: lastName.toUpperCase() }, { $inc: { attendance: 1 } });
      } else {
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne({ uid: uid, firstName: firstName.toUpperCase(), lastName: lastName.toUpperCase(), attendance: 1 });
      }

    }

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }

  const variables = {
    firstName: firstName, 
    lastName: lastName, 
    uid: uid
  }
  res.render('logedIn', variables);
});


app.listen(portNumber);

