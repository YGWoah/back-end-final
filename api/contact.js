const express = require('express')
const router = express.Router()
const {restrict} = require('../middlewre/restrict')
const {dbConnect} = require('../database')
const {getIdByUserName,getInfoByIDs,getDate} = require('../_helpers/getters')
const { json } = require('express')
const fileSystem = require('fs'),path = require('path');
const {checkIfisAlreadyInContact} = require('../_helpers/checkIfIsAlreadyContact')


router.get("/searchcontact",restrict,(req,res)=>{
    try {
        let userName = req.session.user.userName
        let serched=req.query.serached;
        const connection=dbConnect('myDB')
        connection.connect((err)=>{
            if(err) throw err
            connection.query(`SELECT userID, userName,firstName,lastName FROM utilisateurs WHERE userName LIKE '?%'`,[serched],(err,result)=>{
                if(err) throw err
                getIdByUserName(connection,userName).then((resp)=>{
                    console.log(resp);
                    checkIfisAlreadyInContact(connection,result,resp,(newResp)=>{
                        console.log(newResp);
                        res.status(200).json({
                            succes:true,
                            result:newResp
                        })
                    })
                })
                
            })
        })
    } catch (error) {
        
    }
})



router.post("/addcontact",restrict,(req,res)=>{
    let contact1UserName=req.session.user.userName;
    let {contact2UserName}=req.body;
    console.log(req.body);
    console.log(contact2UserName);
    try {
        const connection = dbConnect('myDB')
        connection.connect((err)=>{
            if(err) throw err
            getIdByUserName(connection,contact1UserName).then((userID1)=>{
                getIdByUserName(connection,contact2UserName).then((userID2)=>{
                    connection.query(`INSERT INTO contacts (contact1UserID ,contact2UserID) VALUES 
                        ('${userID1}', '${userID2}')`,(err,result)=>{
                            if(err) throw err
                            res.status(200).json({succes : true})
                        })
                }).catch(()=>{
                    res.status(400).json({succes : false,message:"user2ID not found"})
                })
            }).catch(()=>{
                res.status(400).json({succes : false,message:"user1ID not found"})
            })
        })
    } catch (error) {
        
    }
})


router.get("/allcontacts",restrict,(req,res)=>{
    let userName = req.session.user.userName
    const connection = dbConnect('myDB')
    connection.connect((err)=>{
        if(err) throw err
        getIdByUserName(connection,userName).then((userID)=>{
            connection.query(`SELECT * FROM contacts WHERE contact1UserID = '${userID}' OR contact2UserID = '${userID}'`,(err,result)=>{
                if(err) throw err
                
                if(result[0]!=undefined){
                    getInfoByIDs(connection,userID,result,(newResult)=>{
                        //console.log(newResult);
                        res.status(200).json({
                            succes:true,
                            result:newResult
                        })
                        connection.end()
                    })
                }else{
                    res.status(200).json({
                        succes:false
                    })
                }
                
                
            })
        })
        
    })
})

const getContactIdByIDs = (connection,user1ID,user2ID,callback)=>{
    connection.query(`SELECT contactID FROM contacts WHERE (contact1UserID = '${user1ID}' AND contact2UserID = '${user2ID}') OR 
    (contact2UserID = '${user1ID}' AND contact1UserID = '${user2ID}')`,(err,result)=>{
        if(err) throw err
        callback(result[0].contactID)
    })
}

router.post("/sendmessage",restrict,(req,res)=>{
    let {to,message}=req.body
    let userName = req.session.user.userName
    const connection = dbConnect('myDB')
    if((!to)||(!message)){
        return res.status(400).json({
            succes:false,
            message:"There's no content"
        })
    }
    connection.connect((err)=>{
        if(err) throw err
        getIdByUserName(connection,to).then((usedr1ID)=>{
            getIdByUserName(connection,userName).then((user2ID)=>{
                getContactIdByIDs(connection,usedr1ID,user2ID,(contactid)=>{
                    console.log(contactid);
                    connection.query(`INSERT INTO messages (contactMsgID ,message ,senderID ,timeSent,messageSeen) VALUES
                    (? , ? ,? , ? , ?)`,[contactid,message ,user2ID, getDate(),0],(err,resp)=>{
                        if(err) throw err
                        res.status(200).json({succes:true})
                        connection.end()
                    })
                })
            }).catch((err)=>{
                console.log(err);
            })
        }).catch((err)=>{
            console.log(err);
        })
    })
})

const checkSender = (userID,resultList,callback)=>{

    let i=0,j=0;
    let iterator=resultList[i]
    let newArray=[]
    while(iterator!=undefined){
        if(iterator.senderID==userID){
            newArray.push({
                messageID: iterator.messageID,
                contactID: iterator.contactID,
                message: iterator.message,
                sender:true,
                timeSent:iterator.timeSent
            })
            i++;
        }
        if(iterator.senderID!=userID){
            newArray.push({
                messageID: iterator.messageID,
                contactID: iterator.contactID,
                message: iterator.message,
                sender:false,
                timeSent:iterator.timeSent
            })
            i++;
        }
        iterator=resultList[i]
    }
    callback(newArray)

}

router.post("/getallmessages",restrict,(req,res)=>{
    let {withUser}=req.body
    const connection = dbConnect('myDB')
    let userName = req.session.user.userName
    console.log(userName);
    console.log(withUser);
    if(!(withUser&&userName)){
        return res.status(400).json({
            succes:false,
            message:"There's no content"
        })
    }

    connection.connect((err)=>{
        if(err) throw err
        getIdByUserName(connection,withUser).then((usedr1ID)=>{
            getIdByUserName(connection,userName).then((user2ID)=>{
                getContactIdByIDs(connection,usedr1ID,user2ID,(contactid)=>{
                    //console.log(contactid);
                    connection.query(`SELECT * FROM messages WHERE contactMsgID = '${contactid}'`,(err,result)=>{
                        //console.log(result);
                        checkSender(user2ID,result,(resp)=>{
                            res.status(200).json({
                                succes:true,
                                result:resp
                            })
                        })
                        
                    })
                })
            }).catch((err)=>{
                console.log(err);
            })
        }).catch((err)=>{
            console.log(err);
        })
    })

})

const getLastMsgByContact = (connection,contactIDList,userID)=>{
    return new Promise((resolve,reject)=>{
        let iterator=contactIDList[0];
        let newArray=[];
        let i=0,j=0,k=0;
        let r;
        while(iterator){
            console.log("iterator");
            connection.query(`SELECT * FROM messages WHERE contactMsgID = ${iterator.contactID} ORDER BY messageID DESC LIMIT 1 `,
            (err,result)=>{
                if(err) reject(err)
                let t=contactIDList[i]
                console.log(t);
                if(result[0]==undefined){
                    return i++
                }
                r = {
                    id:i,
                    userName:t.userName,
                    message:result[0].message,
                    sender:((userID===result[0].senderID)?true:false),
                    time:result[0].timeSent
                }
                newArray.push(r)
                i++
                if(i==j) {resolve(newArray)}
                
            })
            j++
            iterator=contactIDList[j]
            
        }
    })
}


router.get("/recentchats",restrict,(req,res)=>{
    let userName = req.session.user.userName 
    console.log("/recentchats");
    const connection = dbConnect('myDB')
    connection.connect((err)=>{
        if(err) throw err
        getIdByUserName(connection,userName).then((userID)=>{
            connection.query(`select contactID,senderID,message,userName,firstName ,lastName from contacts 
            inner join (select *, ROW_NUMBER() over (PARTITION BY contactMsgID ORDER BY timeSent desc) 
            as RowID from messages) as a on contactMsgID=contactID
            inner join utilisateurs on userID =contact1userID where RowID =1 and  contact2userID = ?
            union 
            select contactID,senderID,message,userName,firstName ,lastName from contacts 
            inner join (select *, ROW_NUMBER() over (PARTITION BY contactMsgID ORDER BY timeSent desc) 
            as RowID from messages) as a on contactID=contactMsgID
            inner join utilisateurs on userID =contact2userID  where RowID =1 and contact1userID = ?
            `,[userID,userID],
            (err,result)=>{
                if(err) throw err
                res.status(200).json({
                    succes:true,
                    result:result,
                    userID:userID
                })
            })
        })

    })
})

router.post("/contactprofileimage",restrict,(req,res)=>{
    try {
        let {userName} = req.body
        console.log(req.body);
        const connection = dbConnect('myDB')
        connection.connect((err)=>{
            if(err) throw err
            connection.query(`SELECT profilePicName FROM utilisateurs WHERE userName = ?`,[userName],(err,result)=>{
                if(err) throw err
                connection.end()
                if(!result[0]){
                    var result=[ {
                        profilePicName:"user.png"
                    }]
                }else if(!result[0].profilePicName){
                    result[0].profilePicName="user.png"
                }
                console.log(result[0]);
                var filePath = path.join(__dirname, `./images/${result[0].profilePicName}`);
                var stat = fileSystem.statSync(filePath)
                res.writeHead(200, {
                    'Content-Type': 'image/png',
                    'Content-Length': stat.size
                });
                var readStream = fileSystem.createReadStream(filePath);
                readStream.pipe(res);
            })
        })
    } catch (error) {
        console.log(error);
    }
    
}) 
/**
 * select messageSeen,contactID,senderID,message,userName,firstName ,lastName from contacts 
            inner join (select *, ROW_NUMBER() over (PARTITION BY contactMsgID ORDER BY timeSent desc) 
            as RowID from messages) as a on contactMsgID=contactID
            inner join utilisateurs on userID =contact1userID 
            where RowID =1 and  contact2userID = ? and senderID!=? and messageSeen = 0
            union 
            select messageSeen,contactID,senderID,message,userName,firstName ,lastName from contacts 
            inner join (select *, ROW_NUMBER() over (PARTITION BY contactMsgID ORDER BY timeSent desc) 
            as RowID from messages) as a on contactID=contactMsgID
            inner join utilisateurs on userID =contact2userID  
            where RowID =1 and contact1userID = ? and senderID!=? and messageSeen = 0
 */

router.get("/unseenMessages",restrict,(req,res)=>{
    try {
        let userName = req.session.user.userName 
        const connection = dbConnect('myDB')
        connection.connect((err)=>{
            if(err) throw err
        })
        getIdByUserName(connection,userName).then((userID)=>{
            connection.query(`select message,userName,firstName,lastName,timeSent,RowID from contacts 
            inner join (select *, ROW_NUMBER() over (PARTITION BY contactMsgID ORDER BY timeSent desc) 
            as RowID from messages where messageSeen=0) as a on contactID = contactMsgID 
            inner join utilisateurs on userID= senderID 
            where senderID!= ? and (contact1UserID=? or contact2UserID=?) and RowID=1 `,[userID,userID,userID],(err,result)=>{
                if(err) throw err
                connection.end()
                res.status(200).json({
                    succes:true,
                    result:result
                })
            })

        }).catch((err)=>{
            throw err
        })
        
    } catch (error) {
        console.log(error);
    }
    
})

router.post("/setmessageseen",restrict,(req,res)=>{
    try {
        let userName = req.session.user.userName 
        let {withUser} = req.body
        const connection = dbConnect('myDB')
        connection.connect((err)=>{
            if(err) throw err
        })
        var withUserID 
        getIdByUserName(connection,withUser).then((userID)=>{
            withUserID=userID
        }).catch((err)=>{
            throw err
        })
        getIdByUserName(connection,userName).then((userID)=>{
            connection.query(`update messages set messageSeen = 1 
                where contactMsgID = (select contactID from contacts 
                where (contact1UserID = ? and contact2UserID = ?) or (contact2UserID = ? and contact1UserID = ?) ) `,[userID,withUserID,userID,withUserID],(err,result)=>{
                if(err) throw err
                connection.end()
                res.status(200).json({
                    succes:true,
                })
            })

        })
    } catch (error) {
        console.log(error);
    }
    
})

module.exports = router

