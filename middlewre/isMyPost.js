const { dbConnect } = require('../database');

const isMyPost = (req, res, next) => {
  try {
    const userName = req.session.user.userName;
    const { postID } = req.body;
    console.log(req.body);
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
      connection.query(
        `select userName from posts inner join utilisateurs on posterID = userID where postID = ?`,
        [postID],
        (err, result) => {
          if (err) throw err;
          console.log(result);
          if (result[0].userName == userName) {
            next();
          } else {
            res
              .status(401)
              .json({ succes: false, message: 'u not authorized' });
          }
          connection.end();
        }
      );
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { isMyPost };
