// index.js
'use strict';
var { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');``
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path');

const app = express();
// app.use(bodyParser);
// app.use(bodyParser.urlencoded({
//     extended: false
// }));
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(cors());

const manufactuererProducer = require('../chaincode/mfcPrd.js')
const helper = require("./helper");
const enrollAdmin = require('./enrollAdmin.js');
const registerUser = require('./registerUser.js');
// module.exports.contracts = [manufactuererProducer];

app.post('/register/admin', async(req,res,next)=>{
    let org = req.body.orgName;
    console.log(org);
    let resp = await enrollAdmin.enroll(org);
    res.json(resp);
})

app.post('/register/user', async(req,res,next)=>{
    let usrname = req.body.username;
    let orgName = req.body.orgName;
    console.log(orgName);
    console.log(usrname);
    let resp = registerUser.registerEnrollUser(usrname,orgName);
    res.json(resp);
})

// app.post('/register', async(req,res,next)=>{
// console.log(req.body);
//     let usrname = req.body.username;
//     console.log("Name = ",usrname);
//     let orgName = req.body.orgName;
//     let response = await helper.registerAndGerSecret(usrname, orgName);
//     res.json(response);
// })


app.get('/getStorage', async(req,res,next)=>{
    let ccp = fs.readFile("./connection-profiles/mfc-prd-config.json",'utf8',function(err, data){})
    const walletPath = path.join(process.cwd(),'teafarm-wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath)
    // omitting check for identity
    const gateway = new Gateway();
    await gateway.connect(ccp, {wallet, identity:'user1', discovery:{enabled:true, asLocalhost:false}})
    
    // n/w to which contract is deployed
    const network = await gateway.getNetwork('mfd-prd-channel')
    // get contract
    const contract = network.getContract('mfcPrd.js')
    const storage = await contract.evaluateTransaction('getStorage');

    res.json(storage);
});


app.listen(1080,()=>{
    console.log("======== Server Listening At 1080 =======");
});