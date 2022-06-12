const restrict = (req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.status(401).json({
            succes:false,
            message:"u not logged in"
        })
    }
}

module.exports = {restrict}
