const express = require('express');
const router = express.Router();
const { dbConnect } = require('../database');
const { restrict } = require('../middlewre/restrict');
const { v4: uuidv4 } = require('uuid');
const { getIdByUserName, getDate } = require('../_helpers/getters');
const fileSystem = require('fs'),
  path = require('path');
const { isMyPost } = require('../middlewre/isMyPost');

router.post('/addpost', restrict, (req, res) => {
  if (req.files) {
    var { image } = req.files;
  }
  let { content } = req.body;
  let userName = req.session.user.userName;
  const path = __dirname + '/postImages/';
  let filename = '';
  let newName = '';
  if (image) {
    filename = image.name;
    newName = `${uuidv4()}${filename}`;
    image.mv(`${path}${newName}`, (err) => {
      if (err) console.log(err);
    });
  }

  const connection = dbConnect('myDB');
  connection.connect((err) => {
    getIdByUserName(connection, userName).then((userID) => {
      connection.query(
        `INSERT INTO posts (imageName ,content,postingDate,posterID) VALUES 
            ('${newName}' , '${content}' , '${getDate()}' , '${userID}')`,
        (err) => {
          if (err) {
            console.log(err);
            return res.status(400).json({ succes: false });
          }
          res.status(200).json({ succes: true });
          connection.end();
          console.log('connetion end');
        }
      );
    });
  });
});

router.get('/allposts', restrict, (req, res) => {
  let { userName } = req.query;
  const connection = dbConnect('myDB');
  connection.connect((err) => {
    if (err) throw err;
    getIdByUserName(connection, userName)
      .then((userID) => {
        connection.query(
          `SELECT * FROM posts WHERE posterID = '${userID}' ORDER BY postID DESC limit 10`,
          (err, result) => {
            console.log(result);
            res.status(200).json({
              succes: true,
              result: result,
            });
            connection.end();
            console.log('connetion end');
          }
        );
      })
      .catch((err) => {
        console.log(err);
      });
  });
});

router.post('/getpostimage', restrict, (req, res) => {
  const { postID } = req.body;
  if (!postID) {
    return res.json({ succes: false, message: 'No id provided' });
  }
  try {
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
      connection.query(
        `SELECT imageName FROM posts WHERE postID = '${postID}'`,
        (err, result) => {
          if (err) throw err;
          if (!result[0].imageName) {
            return res.status(400).json({
              succes: true,
              message: 'no image for this post',
            });
          }
          var filePath = path.join(
            __dirname,
            `./postImages/${result[0].imageName}`
          );
          var stat = fileSystem.statSync(filePath);
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': stat.size,
          });
          var readStream = fileSystem.createReadStream(filePath);
          readStream.pipe(res);
          connection.end();
          console.log('connetion end');
        }
      );
    });
  } catch (err) {
    res.status(500).json({ succes: false, eroor: err });
  }
});

router.get('/getcontactposts', restrict, (req, res) => {
  const userName = req.session.user.userName;
  try {
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
      getIdByUserName(connection, userName)
        .then((userID) => {
          connection.query(
            `SELECT postID,posterID,imageName,content,userName FROM posts 
                inner JOIN contacts ON (posterID = contact1UserID)
                LEFT JOIN utilisateurs ON posterID = userID
                WHERE (contact1UserID = ${userID} or contact2UserID = ${userID}) 
                UNION 
                SELECT postID,posterID,imageName,content,userName FROM posts 
                inner JOIN contacts ON (posterID = contact2UserID)
                LEFT JOIN utilisateurs ON posterID = userID
                WHERE (contact1UserID = ${userID} or contact2UserID = ${userID}) 
                ORDER BY postID DESC limit 3`,
            (err, result) => {
              if (err) throw err;
              console.log(result);
              console.log('Length : ', result.length);
              res.status(200).json({
                succes: true,
                result: result,
              });
            }
          );
        })
        .catch((err) => {
          console.log(err);
        });
    });
  } catch (error) {
    console.log(error);
  }
});

router.get('/getmoreposts', restrict, (req, res) => {
  const userName = req.session.user.userName;
  const { postID } = req.query;
  try {
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
      getIdByUserName(connection, userName)
        .then((userID) => {
          connection.query(
            `SELECT postID,posterID,imageName,content,userName FROM posts 
                inner JOIN contacts ON (posterID = contact1UserID)
                LEFT JOIN utilisateurs ON posterID = userID
                WHERE (contact1UserID = ? or contact2UserID = ?) and postID < ?
                UNION 
                SELECT postID,posterID,imageName,content,userName FROM posts 
                inner JOIN contacts ON (posterID = contact2UserID)
                LEFT JOIN utilisateurs ON posterID = userID
                WHERE (contact1UserID = ? or contact2UserID = ?) and postID < ?
                ORDER BY postID DESC limit 2`,
            [userID, userID, postID, userID, userID, postID],
            (err, result) => {
              if (err) throw err;
              console.log(result);
              console.log('Length : ', result.length);
              res.status(200).json({
                succes: true,
                result: result,
              });
            }
          );
        })
        .catch((err) => {
          console.log(err);
        });
    });
  } catch (error) {
    console.log(error);
  }
});

router.get('/getpost', restrict, (req, res) => {
  let { postID } = req.query;
  const connection = dbConnect('myDB');
  connection.connect((err) => {
    connection.query(
      `SELECT imageName,content,postingDate,userName,student,profilePicName from posts 
        left join utilisateurs on posterID=userID where postID = '${postID}'`,
      (err, result) => {
        if (err) throw err;
        res.status(200).json({ succes: true, result: result });
      }
    );
  });
});

router.post('/getposterimageprofile', restrict, (req, res) => {
  const { postID } = req.body;
  if (!postID) {
    return res.json({ succes: false, message: 'No id provided' });
  }
  try {
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
      connection.query(
        `SELECT profilePicName FROM posts left join utilisateurs
            on posterID = userID
            WHERE postID = '${postID}'`,
        (err, result) => {
          if (err) throw err;
          if (!result[0].profilePicName) {
            result[0].profilePicName = 'user.png';
          }
          var filePath = path.join(
            __dirname,
            `./images/${result[0].profilePicName}`
          );
          var stat = fileSystem.statSync(filePath);
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': stat.size,
          });
          var readStream = fileSystem.createReadStream(filePath);
          readStream.pipe(res);
          connection.end();
          console.log('connetion end');
        }
      );
    });
  } catch (err) {
    res.status(500).json({ succes: false, eroor: err });
  }
});

router.post('/addreply', restrict, (req, res) => {
  let file = null;
  if (req.files) {
    file = req.files.image;
  }
  let { content, toPostID } = req.body;
  let userName = req.session.user.userName;
  let newName = null;
  if (file) {
    const path = __dirname + '/replyImages/';
    const filename = file.name;
    newName = `${uuidv4()}${filename}`;
    file.mv(`${path}${newName}`, (err) => {
      if (err) console.log(err);
    });
  }

  const connection = dbConnect('myDB');
  connection.connect((err) => {
    getIdByUserName(connection, userName).then((replierID) => {
      connection.query(
        `INSERT INTO replies (toPostID ,replierID,replyContent,replyImage,replyingTime) VALUES 
            ('${toPostID}' , '${replierID}' ,'${content}', '${newName}' , '${getDate()}')`,
        (err) => {
          if (err) {
            console.log(err);
            return res.status(400).json({ succes: false });
          }
          res.status(200).json({ succes: true });
          connection.end();
          console.log('connetion end');
        }
      );
    });
  });
});

router.get('/getreplies', restrict, (req, res) => {
  let { postID } = req.query;

  const connection = dbConnect('myDB');
  connection.connect((err) => {
    if (err) throw err;
    connection.query(
      `SELECT replyID,replyContent,replyImage,replyingTime,userName,profilePicName 
        from replies  left join utilisateurs on replierID = userID where toPostID = '${postID}'`,
      (err, result) => {
        if (err) throw err;
        res.status(200).json({ succes: true, result: result });
        console.log(result);
      }
    );
  });
});

router.post('/replyimage', restrict, (req, res) => {
  let { replyImage } = req.body;
  console.log('hh');
  console.log(replyImage);
  if (replyImage == null || !replyImage) {
    console.log('hh');
    console.log(replyImage);
    return res.status(400).json({
      succes: false,
    });
  }
  var filePath = path.join(__dirname, `./replyImages/${replyImage}`);
  var stat = fileSystem.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': stat.size,
  });
  var readStream = fileSystem.createReadStream(filePath);
  readStream.pipe(res);
});

router.post('/deletepost', [restrict, isMyPost], (req, res) => {
  const { postID } = req.body;
  const connection = dbConnect('myDB');
  connection.connect((err) => {
    if (err) throw err;
  });
  connection.query(
    `delete from replies where toPostID = ?`,
    [postID],
    (err) => {
      if (err) throw err;
      connection.query(
        `delete from posts where postID = ?`,
        [postID],
        (err) => {
          if (err) throw err;
          connection.end();
          res.status(200).json({
            succes: true,
          });
        }
      );
    }
  );
});

module.exports = router;
