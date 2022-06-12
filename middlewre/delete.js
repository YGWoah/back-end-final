
const {dbConnect} = require('../database')

const connection=dbConnect('myDB')
connection.connect()

connection.query(`select contactID,message,userName,firstName  from contacts 
            inner join (select *, ROW_NUMBER() over (PARTITION BY contactMsgID ORDER BY timeSent desc) 
            as RowID from messages) as a on contactMsgID=contactID
            inner join utilisateurs on userID =contact1userID where RowID =1 and  contact2userID = ?
            union 
            select contactID,message,userName,firstName from contacts 
            inner join (select *, ROW_NUMBER() over (PARTITION BY contactMsgID ORDER BY timeSent desc) 
            as RowID from messages) as a on contactID=contactMsgID
            inner join utilisateurs on userID =contact2userID  where RowID =1 and contact1userID = ?
            `,[21,21,21,21],
            (err,result)=>{
                if(err) throw err
                console.log(result);
                console.log(result.length);
})
