

const userNameIsUnique = (connection,UserName)=>{
    return new Promise((resolve,reject)=>{
        connection.query(`SELECT * FROM utilisateurs WHERE userName = '${UserName}'`,(err,result)=>{
            if(err){throw err}
            if(result.length>0){
                reject()
            }else if(result.length==0){
                resolve()
            }
        })
    })
}






module.exports ={userNameIsUnique}