const checkIfisAlreadyInContact = (connection,ArrayResult,user1ID,callback)=>{
    if(ArrayResult.length==0){
        return callback([])
    }
    let i=0,j=0;
    let iterator=ArrayResult[i];
    let user2ID;
    let newArrayResult=[]
    while(iterator){
        user2ID = iterator.userID
        connection.query(`SELECT contactID from contacts where (contact1UserID='${user1ID}' AND contact2UserID='${user2ID}') OR (contact1UserID='${user2ID}' AND contact2UserID='${user1ID}')`,(err,result)=>{
            if(err) throw err
            criterator=ArrayResult[j]
            console.clear()
            console.log("result");
            console.log(result);
            if(result[0]==undefined){
                newArrayResult.push({
                    userName:criterator.userName,
                    name:criterator.firstName+" "+criterator.lastName,
                    iscontact:false
                })
            }else{
                newArrayResult.push({
                    userName:criterator.userName,
                    name:criterator.firstName+" "+criterator.lastName,
                    iscontact:true
                })
            }
            j++
            if(i==j){
                callback(newArrayResult)
            }
        })
        console.log(iterator);

        i++
        iterator=ArrayResult[i]
    }
    
}


module.exports = {checkIfisAlreadyInContact}