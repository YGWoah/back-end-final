const express = require('express');
const router = express.Router();
const { restrict } = require('../middlewre/restrict');
const { dbConnect } = require('../database');
const {
  getIdByUserName,
  getInfoByIDs,
  getDate,
} = require('../_helpers/getters');
const { json } = require('express');
const fileSystem = require('fs'),
  path = require('path');
const { isTeacher } = require('../middlewre/isTeacher');
const { isTeacherOF } = require('../middlewre/belongsto');
const { v4: uuidv4 } = require('uuid');

const verifyClassNameUnique = (connection, className) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `select className from class where className = '${className}'`,
      (err, result) => {
        if (err) throw err;
        if (result[0]) {
          reject();
        } else if (!result[0]) {
          resolve();
        }
      }
    );
  });
};

router.post('/createclass', [restrict, isTeacher], (req, res) => {
  const userName = req.session.user.userName;
  const { className } = req.body;
  let classCode = uuidv4();
  const connection = dbConnect('myDB');
  connection.connect((err) => {
    if (err) throw err;
    verifyClassNameUnique(connection, className)
      .then(() => {
        getIdByUserName(connection, userName)
          .then((teacherID) => {
            connection.query(
              `insert into class (teacherID ,className ,classCode) VALUES 
                ('${teacherID}','${className}','${classCode}')`,
              (err, result) => {
                if (err) throw err;
                res
                  .status(200)
                  .json({ succes: true, classCode: classCode });
              }
            );
          })
          .catch((err) => {
            res.status(400).json({
              succes: false,
              error: err,
            });
          });
      })
      .catch(() => {
        res.status(400).json({
          succes: false,
          message: 'Classname is already been used',
        });
      });
  });
});

router.post('/addstudent', restrict, (req, res) => {
  try {
    const userName = req.session.user.userName;
    let { className } = req.body;
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) err;
      connection.query(
        `select classID from class where className = ?`,
        [className],
        (err, result) => {
          if (err) throw err;
          if (!result[0]) {
            res.status(400).json({
              succes: false,
              message: 'Class not found',
            });
          } else {
            getIdByUserName(connection, userName).then((userID) => {
              connection.query(
                `insert into liste (classeID ,studentID) VALUES 
                        ('${result[0].classID}' , '${userID}')`,
                (err) => {
                  if (err) throw err;
                  res.status(200).json({
                    succes: true,
                  });
                }
              );
            });
          }
        }
      );
    });
  } catch (error) {
    console.log(error);
  }
});

router.get('/allclasses', [restrict, isTeacher], (req, res) => {
  const userName = req.session.user.userName;
  const connection = dbConnect('myDB');
  connection.connect((err) => {
    if (err) throw err;
    getIdByUserName(connection, userName).then((teacherID) => {
      connection.query(
        `select className,classCode from class where teacherID = '${teacherID}'`,
        (err, result) => {
          if (err) throw err;
          connection.end();
          res.status(200).json({
            succes: true,
            result: result,
          });
        }
      );
    });
  });
});

router.get('/allstudentclasses', restrict, (req, res) => {
  const userName = req.session.user.userName;
  const connection = dbConnect('myDB');
  connection.connect((err) => {
    if (err) throw err;
    getIdByUserName(connection, userName).then((studentID) => {
      connection.query(
        `select firstName,lastName,teacherID,className,classCode from liste 
        left join class on classID=classeID
        left join utilisateurs on userID = teacherID
        where studentID = '${studentID}'`,
        (err, result) => {
          if (err) throw err;
          connection.end();
          res.status(200).json({
            succes: true,
            result: result,
          });
        }
      );
    });
  });
});

router.post(
  '/uploadcourse',
  [restrict, isTeacher, isTeacherOF],
  (req, res) => {
    console.log('Upload course');
    try {
      if (req.files) {
        var file = req.files.file;
        var path = __dirname + '/courses/';
        var filename = file.name;
        var newName = `${uuidv4()}${filename}`;
      } else {
        var newName = null;
      }
      let { content, className } = req.body;

      const connection = dbConnect('myDB');
      connection.connect((err) => {
        if (err) throw err;
        connection.query(
          `SELECT classID from class where className = '${className}'`,
          (err, result) => {
            if (err) throw err;
            if (!result[0]) {
              return res.status(400).json({
                succes: false,
                message: 'class is not found',
              });
            }
            if (req.files) {
              file.mv(`${path}${newName}`, (err) => {
                if (err) console.log(err);
              });
            }

            connection.query(
              `INSERT INTO course (classeID ,content,pdfName) VALUES 
                ( ? , ? , ?)`,
              [result[0].classID, content, newName],
              (err) => {
                if (err) throw err;
                res.status(200).json({
                  succes: true,
                  message: 'course was succefully uploaded',
                });
                connection.query(
                  `update liste set seenAll = 0 where classeID = ?`,
                  [result[0].classID],
                  (err2) => {
                    if (err2) throw err2;
                  }
                );
              }
            );
          }
        );
      });
    } catch (error) {
      console.log(error);
    }
  }
);

router.post('/searchclass', restrict, (req, res) => {
  try {
    const { className } = req.body;
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
      connection.query(
        `select className,firstName,lastName,userName from class join 
            utilisateurs on teacherID = userID where className LIKE concat('%', ?, '%')`,
        [className],
        (err, result) => {
          if (err) throw err;
          connection.end();
          if (!result[0]) {
            return res.status(200).json({
              succes: false,
              message: 'No results',
            });
          }
          res.status(200).json({
            succes: true,
            result: result[0],
          });
        }
      );
    });
  } catch (error) {
    console.log(error);
  }
});

router.post('/downloadcourse', (req, res) => {
  try {
    console.log(req.body);
    let { fileName } = req.body;
    const path = __dirname + '/courses/' + fileName;

    res.download(path, (err) => {
      if (err) {
        res.send({
          error: err,
          msg: 'Problem downloading the file',
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

router.get('/allmodulecourses', restrict, (req, res) => {
  let { className } = req.query;
  const connection = dbConnect('myDB');
  connection.connect((err) => {
    if (err) throw err;
    connection.query(
      `select content,pdfName from class join course on classeID = classID 
        where className = '${className}'`,
      (err, result) => {
        if (err) throw err;
        connection.query(
          `select firstName,lastName,userName from class join utilisateurs
            on teacherID = userID where className = '${className}'`,
          (err, result2) => {
            if (err) throw err;
            connection.end();
            res.json({
              succes: true,
              result: result,
              info: result2[0],
            });
          }
        );
      }
    );
  });
});

router.post('/leaveclass', restrict, (req, res) => {
  try {
    const userName = req.session.user.userName;
    const { className } = req.body;
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
      getIdByUserName(connection, userName).then((userID) => {
        connection.query(
          `select rowID from liste join class on classeID=classID 
                where className='${className}' and studentID='${userID}'`,
          (err, result) => {
            if (err) throw err;
            if (result[0]) {
              connection.query(
                `DELETE FROM liste WHERE rowID = '${result[0].rowID}'`,
                (err) => {
                  if (err) throw err;
                  res.status(200).json({
                    succes: true,
                  });
                }
              );
            } else {
              res.status(400).json({
                succes: false,
              });
            }
          }
        );
      });
    });
  } catch (error) {}
});

router.post(
  '/deletclass',
  [restrict, isTeacher, isTeacherOF],
  (req, res) => {
    try {
      let { className } = req.body;
      const userName = req.session.user.userName;

      const connection = dbConnect('myDB');
      connection.connect((err) => {
        if (err) throw err;
        getIdByUserName(connection, userName).then((userID) => {
          connection.query(
            `select teacherID,classID from class where className = '${className}'`,
            (err, result) => {
              if (err) throw err;
              if (!result[0]) {
                connection.end();
                res.status(400).json({
                  succes: false,
                });
              }
              if (result[0].teacherID == userID) {
                connection.query(
                  `delete from liste where classeID = '${result[0].classID}'`,
                  (err) => {
                    if (err) throw err;
                    connection.query(
                      `delete from course where classeID = '${result[0].classID}'`,
                      (err) => {
                        if (err) throw err;
                      }
                    );
                    connection.query(
                      `delete from class where classID = '${result[0].classID}'`,
                      (err) => {
                        if (err) throw err;
                      }
                    );
                  }
                );

                res.status(200).json({
                  succes: true,
                });
              }
            }
          );
        });
      });
    } catch (error) {}
  }
);

router.get('/coursenotification', restrict, (req, res) => {
  try {
    const userName = req.session.user.userName;
    const connection = dbConnect('myDB');
    connection.connect((err) => {
      if (err) throw err;
    });
    getIdByUserName(connection, userName).then((userID) => {
      connection.query(
        `select className,firstName,lastName,userName from liste 
            join class on classeID = classID join utilisateurs on teacherID = userID 
            where studentID = ? and seenAll = 0 `,
        [userID],
        (err, result) => {
          if (err) throw err;
          connection.end();
          res.status(200).json({
            succes: true,
            result: result,
          });
        }
      );
    });
  } catch (error) {
    console.log(error);
  }
});

router.post('/setAllSeen', restrict, (req, res) => {
  const userName = req.session.user.userName;
  const { className } = req.body;
  const connection = dbConnect('myDB');
  connection.connect((err) => {
    if (err) throw err;
  });
  getIdByUserName(connection, userName).then((userID) => {
    connection.query(
      `update liste SET seenAll = 1 
        where studentID = ? and classeID = (select classID from class where className = ?)`,
      [userID, className],
      (err) => {
        if (err) throw err;
        res.status(200).json({
          succes: true,
        });
      }
    );
  });
});

module.exports = router;
