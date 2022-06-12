const { dbConnect } = require('../database');

const autherize = (req, res, next) => {
  try {
    const { userName, password } = req.body;

    if (userName.length > 0 && password.length > 0) {
      console.log('user' + userName + ' just logged in');
      const connection = dbConnect('myDB');
      connection.connect((err) => {
        if (err) throw err;
        connection.query(
          `SELECT password,student FROM utilisateurs WHERE userName = ?`,
          [userName],
          (err, result, feilds) => {
            if (err) throw err;
            if (!result[0]) {
              res.status(200).json({
                succes: false,
                message: 'the email is uncorrect',
              });
            } else if (result[0].password === password) {
              req.session.user = {
                userName: userName,
                student: result[0].student,
              };
              res.status(200).json({
                succes: true,
                userName: userName,
                student: result[0].student,
              });
            } else {
              res.status(200).json({
                succes: false,
                message: 'the password is uncorrect',
              });
            }
            connection.end();
          }
        );
      });
    } else {
      res
        .status(400)
        .json({ succes: false, message: 'the data is empty' });
    }
  } catch (error) {
    throw error;
  }
};

module.exports = { autherize };
