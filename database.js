var mysql = require('mysql');

const dbConnect = (db_name) => {
  const connection = mysql.createConnection({
    host: 'sql11.freesqldatabase.com',
    user: 'sql11499341',
    password: 'dsNFDUQ4te',
    database: 'sql11499341',
    port: 3306,
    multipleStatements: false,
  });
  return connection;
};

module.exports = { dbConnect };
