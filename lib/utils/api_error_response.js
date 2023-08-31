var config = require('../config'),
    crypto = require('crypto');

var apiErrorResponse = {};

apiErrorResponse.respondWithErrorRef = function(response, statusCode, errorMsg, errObj) {
  var refId = crypto.randomUUID();

  console.error("Received internal error", {
    refId: refId,
    statusCode: statusCode,
    errorMsg: errorMsg,
    errObj: errObj
  });

  response.status(statusCode).send({
    refId: refId,
    errorMsg: errorMsg
  });
};

module.exports = apiErrorResponse;
