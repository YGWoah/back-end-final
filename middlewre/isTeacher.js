const {dbConnect} = require('../database')

const isTeacher = (req,res,next)=>{
    try {
        const userName=req.session.user.userName
        const connection = dbConnect('myDB')
        connection.connect((err)=>{
            if(err) throw err
            connection.query(`select student from utilisateurs where userName = '${userName}'`,(err,result)=>{
                if(err) throw err
                if(!result[0].student){
                    next()
                }else{
                    res.status(401).json({succes:false,message:"u not a teacher"})
                }
                connection.end()
            })
        })
    } catch (error) {
        console.log(error);
    }
}

module.exports = {isTeacher}
