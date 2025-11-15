// middlewares/responseHandler.js
function responseHandler(req, res, next) {
  res.success = (message, data = {}) => {
    res.status(200).json({
      success: true,
      message,
      ...data
    });
  };

  res.error = (message, status = 500, details = '') => {
    res.status(status).json({
      success: false,
      message,
      details
    });
  };

  next();
}

module.exports = responseHandler;
