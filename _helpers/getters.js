const getIdByUserName = (connection,userName)=>{
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT userID FROM utilisateurs WHERE userName = '${userName}'`,
        (err,result)=>{
            if(err) throw err
            if(result.length>0){
                resolve(result[0].userID)
            }else if(result.length==0){
                reject("user has no userID")
            }
        })
    })
}



const getInfoByIDs = (connection,mainUserID,resultArray,callback)=>{
    let contactInfo = [];
    let i=0,j=0;
    let iterator=resultArray[i];
    while(iterator!=undefined){
        if(iterator.contact1UserID!=mainUserID){
            connection.query(`SELECT lastName ,firstName ,userName FROM utilisateurs WHERE userID = '${iterator.contact1UserID}'`,(err,result,feilds)=>{
                if(err) throw err
                if(result==undefined){
                    return 
                }else{
                    contactInfo.push(result[0])
                }
                j++;
                if(resultArray.length==j){
                    callback(contactInfo)
                }
            })
        }else if(iterator.contact2UserID!=mainUserID){
            connection.query(`SELECT lastName ,firstName ,userName FROM utilisateurs WHERE userID = '${iterator.contact2UserID}'`,(err,result,feilds)=>{
            
                if(err) throw err
                if(result==undefined){
                    return 
                }else{
                    contactInfo.push(result[0])
                }
                j++;
                if(resultArray.length==j){
                    callback(contactInfo)
                }
                
            })
        }
        i++;
        iterator=resultArray[i]
    }
}

const getDate = ()=>{
    let date = new Date()
    let newDate = date.getFullYear()+"-"+date.getMonth()+"-"+date.getDay()+"T"+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()
    return newDate
}

module.exports ={getInfoByIDs, getIdByUserName,getDate}