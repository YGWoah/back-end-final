const restrict = (req, res, next) => {
  try {
    if (req.session.user) {
      next();
    } else {
      res.status(401).json({
        succes: false,
        message: 'u not logged in',
      });
    }
  } catch (error) {
    res.json({
      succes: false,
      message: error,
    });
  }
};

module.exports = { restrict };
