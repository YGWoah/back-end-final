const {dbConnect} = require('../database')
const { getIdByUserName } = require('../_helpers/getters')

const isTeacherOF = (req,res,next)=>{
    try {
        const {className} = req.body
        const userName = req.session.user.userName
        const connection = dbConnect('myDB')
        connection.connect((err)=>{
            if(err) throw err
            getIdByUserName(connection,userName).then((userID)=>{
                connection.query(`select teacherID from class where className = '${className}'`,(err,result)=>{
                    if(err) throw err
                    if(!result[0]){
                        connection.end()
                        return res.status(200).json({succes:false})
                    }
                    if(result[0].teacherID==userID){
                        next()
                    }
                    
                })
            })
            
        })

    } catch (error) {
        throw error
    }
}

module.exports ={isTeacherOF}
