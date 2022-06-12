const express = require('express')
const router = express.Router()
const {dbConnect} = require('../database')
const {getIdByUserName} = require('../_helpers/getters')


const {checkIfisAlreadyInContact} = require('../_helpers/checkIfIsAlreadyContact')
const { restrict } = require('../middlewre/restrict')



const getPeople = (connection,req)=>{
    return new Promise((resolve)=>{
        let userName = req.session.user.userName
        let {serched} = req.query
            connection.query(`SELECT userID, userName,firstName,lastName,student FROM utilisateurs WHERE userName LIKE concat('%', ?, '%') LIMIT 10`,[serched],(err,result)=>{
                if(err) throw err
                if(result.length==0){
                    resolve([])
                }
                getIdByUserName(connection,userName).then((resp)=>{
                    checkIfisAlreadyInContact(connection,result,resp,(newResp)=>{
                        resolve(newResp)
                    })
                    })
                    .catch((err)=>{
                        console.log(err);
                    })
                })
                
            })

}
    


const getPosts = (connection,req)=>{
    return new Promise((resolve)=>{
        let {serched} = req.query
            connection.query(`SELECT postID,imageName,content,userName FROM posts join utilisateurs on posterID = userID WHERE content LIKE concat('%', ?, '%') limit 10`,[serched],(err,result)=>{
                if(err) throw err
                resolve(result)
            })
    }) 
}

const getCourses = (connection,req)=>{
    return new Promise((resolve)=>{
        let {serched} = req.query
        connection.query(`SELECT teacherID,content,pdfName,userName,className FROM class 
        join utilisateurs on teacherId = userID join course on classeID = classID
        WHERE content LIKE concat('%', ?, '%') limit 10`,[serched],(err,result)=>{
            if(err) throw err
            resolve(result)
        })
    }) 
}

const getAll = (connection,req)=>{
    
    return new Promise((resolve)=>{
        let result = {
            people:[],
            posts:[],
            course:[]
        }
        let ppl=false,post=false,course=false;
        getPosts(connection,req).then((res)=>{
            result.posts=res
            ppl=true
            if(ppl&&post&&course) {resolve(result)}else{console.log("not yet post")}
        })
        getPeople(connection,req).then((res)=>{
            result.people=res
            post=true
            if(ppl&&post&&course) {resolve(result)}else{console.log("not yet people")}
        })
        getCourses(connection,req).then((res)=>{
            result.course=res
            console.log(res);
            course=true
            if(ppl&&post&&course) {resolve(result)}else{console.log("not yet course")}
        })

    })
}


router.get("/search",restrict,(req,res)=>{
    const connection=dbConnect('myDB')
    connection.connect()
    getAll(connection,req).then((result)=>{
        res.status(200).json({
            succes:true,
            result:result
        })
    })
})

module.exports = router
