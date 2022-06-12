const {dbConnect} = require('./database')
let connection = dbConnect('myDB')

let dbConnection = (callback)=>{
    console.log("connetion made");
    connection.connect((err)=>{
        callback(err,connection)
    })
}

module.exports = {dbConnection}