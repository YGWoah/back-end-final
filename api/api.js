const express = require('express');
const router = express.Router();
const { dbConnect } = require('../database');
const { userNameIsUnique } = require('../_helpers/isUnique');
const { autherize } = require('../middlewre/autherize');
const { restrict } = require('../middlewre/restrict');
const { v4: uuidv4 } = require('uuid');
const { getIdByUserName, getDate } = require('../_helpers/getters');

const fileSystem = require('fs'),
  path = require('path');

router.post('/signin', (req, res) => {
  try {
    console.log('sign in section\n');
    const { firstName, lastName, userName, role, password } =
      req.body;
    console.log('thes');
    if (
      firstName.length == 0 ||
      lastName.leangth == 0 ||
      userName.leangth == 0 ||
      password.leangth == 0
    ) {
      res.status(400).json({ succese: false });
      return;
    } else {
      const connection = dbConnect('myDB');
      connection.connect((err) => {
        if (err) throw err;
        userNameIsUnique(connection, userName)
          .then(() => {
            connection.query(
              `INSERT INTO utilisateurs (firstName, lastName, userName,student, password) VALUES 
                        (?, ?, ?, ?, ?)`,
              [firstName, lastName, userName, role ? 1 : 0, password],
              (err, result, feilds) => {
                if (err) throw err;
                res.status(200).json({
                  succes: true,
                  message: 'You have signed succefully',
                });
                connection.end();
              }
            );
          })
          .catch(() => {
            res.status(200).json({
              succes: false,
              message: 'The userName is not unique',
            });
            connection.end();
          });
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post('/login', (req, res) => {
  try {
    const { userName, password } = req.body;

    if (userName.length > 0 && password.length > 0) {
      console.log('user' + userName + ' just logged in');
      const connection = dbConnect('myDB');
      connection.connect((err) => {
        if (err) throw err;
        connection.query(
          'SELECT password,student FROM utilisateurs WHERE userName = ?',
          [userName],
          (err, result) => {
            console.log(result);
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
});

router.post('/checklogin', restrict, (req, res) => {
  res.status(200).json({
    succes: true,
    userName: req.session.user.userName,
    student: req.session.user.student,
  });
});

router.post('/logout', restrict, (req, res) => {
  req.session.destroy();
  res.status(200).json({
    succes: true,
  });
});

const handleUserName = (connection, req) => {
  const { newUserName } = req.body;
  connection.query(
    `UPDATE utilisateurs SET userName = '${newUserName}' WHERE userName = '${userName}'`,
    (err) => {
      if (err) throw err;
    }
  );
};

const isMycontact = () => {
  connection.query(`select contactID`);
};

router.get('/allinfo', restrict, (req, res) => {
  var { userName, isMyprofile } = req.query;
  if (!userName) {
    userName = req.session.user.userName;
  }

  const connection = dbConnect('myDB');
  connection.connect((err) => {
    if (err) throw err;
    connection.query(
      `select firstName,lastName,bio from utilisateurs WHERE userName = ?`,
      [userName],
      (err, result) => {
        if (err) throw err;
        if (!result[0]) {
          return res.status(400).json({
            succes: false,
            result: 'the user dosent exist',
          });
        }
        if (isMyprofile) {
          getIdByUserName(connection, userName).then((userID1) => {
            getIdByUserName(connection, userName).then((userID2) => {
              connection.query(
                `select contactID from contacts 
              where (contact1UserID = ? or contact2UserID = ?) or (contact2UserID = ? or contact1UserID = ?)`,
                [userID1, userID2, userID1, userID2],
                (err, result2) => {
                  connection.end();
                  if (result2[0]) {
                    return res.status(200).json({
                      succes: true,
                      result: result[0],
                      isContact: true,
                    });
                  }
                }
              );
            });
          });
        }
        res.status(200).json({
          succes: true,
          result: result[0],
          isContact: false,
        });
        connection.end();
      }
    );
  });
});

router.post('/updateLastName', restrict, (req, res) => {
  try {
    const userName = req.session.user.userName;
    const { lastName } = req.body;
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
      connection.query(
        `UPDATE utilisateurs SET lastName = '${lastName}' WHERE userName = '${userName}'`,
        (err) => {
          if (err) throw err;
          res.status(200).json({ succes: true });
          connection.end();
        }
      );
    });
  } catch (error) {
    console.log(erorr);
  }
});

router.post('/updateFirstName', restrict, (req, res) => {
  try {
    const userName = req.session.user.userName;
    const { firstName } = req.body;
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
      connection.query(
        `UPDATE utilisateurs SET firstName = '${firstName}' WHERE userName = '${userName}'`,
        (err) => {
          if (err) throw err;
          res.status(200).json({ succes: true });
          connection.end();
        }
      );
    });
  } catch (error) {
    console.log(erorr);
  }
});

router.post('/updatebio', restrict, (req, res) => {
  try {
    const userName = req.session.user.userName;
    const { bio } = req.body;
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
      connection.query(
        `UPDATE utilisateurs SET bio = "${bio}" WHERE userName = '${userName}'`,
        (err) => {
          if (err) throw err;
          res.status(200).json({ succes: true });
          connection.end();
        }
      );
    });
  } catch (error) {
    console.log(erorr);
  }
});

router.post('/updatepassword', restrict, (req, res) => {
  try {
    const userName = req.session.user.userName;
    const { password } = req.body;
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
      connection.query(
        `UPDATE utilisateurs SET password = '${password}' WHERE userName = '${userName}'`,
        (err) => {
          if (err) throw err;
          res.status(200).json({ succes: true });
          connection.end();
        }
      );
    });
  } catch (error) {
    console.log(erorr);
  }
});

router.post('/updateprofilepic', restrict, (req, res) => {
  const newpath = __dirname + '/images/';
  const userName = req.session.user.userName;
  const connection = dbConnect('myDB');
  const file = req.files.file;
  connection.connect(async (err) => {
    if (err) throw err;
    new Promise((resolve1, reject) => {
      connection.query(
        `SELECT profilePicName FROM utilisateurs WHERE userName = '${userName}'`,
        (err, result) => {
          if (err) throw err;
          console.log(result);
          if (result[0].profilePicName) {
            file.mv(
              `${newpath}${result[0].profilePicName}`,
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  connection.end();
                  res.status(200).json({
                    succes: true,
                  });
                }
              }
            );
          } else {
            const filename = file.name;
            const newName = `${uuidv4()}${filename}`;
            file.mv(`${newpath}${newName}`, (err) => {
              if (err) {
                throw err;
              } else {
                resolve1(newName);
              }
            });
          }
        }
      );
    })
      .then((newName) => {
        console.log('almostDone');
        connection.query(
          `UPDATE utilisateurs SET profilePicName = '${newName}' WHERE userName = '${userName}'`,
          (err) => {
            if (err) throw err;
            connection.end();
            res.status(200).json({
              succes: true,
            });
            console.log('done');
          }
        );
      })
      .catch(() => {
        res.status(400).json({
          succes: false,
          message: 'Error accured',
        });
      });
  });
});

router.post('/getprofilepic', restrict, (req, res) => {
  const { userName } = req.body;
  const connection = dbConnect('myDB');
  connection.connect((err) => {
    if (err) throw err;
    connection.query(
      `SELECT profilePicName FROM utilisateurs WHERE userName = '${userName}'`,
      (err, result) => {
        if (err) throw err;
        connection.end();
        if (!result[0]) {
          result[0] = {
            profilePicName: 'user.png',
          };
        } else if (!result[0].profilePicName) {
          result[0] = {
            profilePicName: 'user.png',
          };
        }
        console.log(result[0]);
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
      }
    );
  });
});

router.post('/deleteacount', restrict, (req, res) => {
  const { password } = req.body;
  const userName = req.session.user.userName;
  const connection = dbConnect('myDB');
  connection.connect((err) => {
    if (err) throw err;
  });
  getIdByUserName(connection, userName).then((userID) => {
    connection.query(
      `delete from messages where contactMsgID = (
      select contactID where contact1UserID = ? or contact1UserID = ?
    )`,
      [userID, userID],
      (err, result) => {}
    );
  });
});

module.exports = router;
