const { dbConnection } = require('../connectionDatabase')

dbConnection((err,connection)=>{
    connection.query(`SELECT postID,posterID,contactID,userName FROM posts full JOIN contacts ON (posterID = contact2UserID or posterID = contact1UserID)
    LEFT JOIN utilisateurs ON posterID = userID
    WHERE (contact1UserID = 13 or contact2UserID = 13)`,(err,result)=>{
        if(err) throw err
        console.log(result);
        console.log("Leangth",result.length);
    })
})