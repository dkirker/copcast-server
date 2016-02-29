/**
 * Created by brunosiqueira on 29/02/16.
 */
  templatesDir = path.resolve(__dirname, '..', 'templates'),
  emailTemplates = require('email-templates'),
  nodemailer = require('nodemailer'),
  config = require('../config'),
  _ = require('lodash'),
  smtpTransport = nodemailer.createTransport("SMTP", {
    service: config.email.service,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });

var emailManager  = {};

emailManager.sendEmailExportSuccess = function(email, downloadUrl, username, callback) {
  emailTemplates(templatesDir, function (err, template) {
    if (err) {
      console.log(err);
      callback(false, err);
    } else {
      var locals = {
        email: email,
        username: username,
        downloadUrl: downloadUrl
      };
      template("export", locals, function (err, html, text) {
        if (err) {
          console.log(err);
          callback(false, err);
        } else {
          if (smtpTransport) {
            smtpTransport.sendMail({
              from: config.email.from,
              to: locals.email,
              subject: "Video export is ready",
              html: html
            }, function (err, responseStatus) {
              if (err) {
                console.log(err);
                callback(false, err);
              } else {
                console.log(responseStatus.message);
                callback(true);
              }
            });
          } else {
            callback(false, 'problems with smtpTransport. returning HTTP 500');
          }
        }
      });
    }
  });
};
emailManager.sendEmailErrorExport = function(email, username, callback) {
  emailTemplates(templatesDir, function (err, template) {
    if (err) {
      console.log(err);
      callback(false, err);
    } else {
      var locals = {
        email: email,
        username: username
      };
      template("errorExport", locals, function (err, html, text) {
        if (err) {
          console.log(err);
          callback(false, err);
        } else {
          if (smtpTransport) {
            smtpTransport.sendMail({
              from: config.email.from,
              to: locals.email,
              subject: "There was an error exporting your videos",
              html: html
            }, function (err, responseStatus) {
              if (err) {
                console.log(err);
                callback(false, err);
              } else {
                console.log(responseStatus.message);
                callback(true);
              }
            });
          } else {
            callback(false, 'problems with smtpTransport. returning HTTP 500');
          }
        }
      });
    }
  });
};

emailManager.sendEmailForgotPassword = function(email, accessUrl, username, callback) {
  emailTemplates(templatesDir, function (err, template) {
    if (err) {
      console.log(err);
      callback(false, err);
    } else {
      var locals = {
        email: email,
        username: username,
        accessUrl: accessUrl
      };
      template("forgotPass", locals, function (err, html, text) {
        if (err) {
          console.log(err);
          callback(false, err);
        } else {
          if (smtpTransport) {
            smtpTransport.sendMail({
              from: config.email.from,
              to: locals.email,
              subject: "New Password",
              html: html
            }, function (err, responseStatus) {
              if (err) {
                console.log(err);
                callback(false, err);
              } else {
                console.log(responseStatus.message);
                callback(true);
              }
            });
          } else {
            callback(false, 'problems with smtpTransport. returning HTTP 500');
          }
        }
      });
    }
  });
}


emailManager.sendEmailAdmError = function(err, username, callback) {
  emailTemplates(templatesDir, function (err, template) {
    if (err) {
      console.log(err);
      callback(false, err);
    } else {
      var locals = {
        email: config.email.administrator,
        username: username,
        err: JSON.stringify(err)
      };
      template("errorAdm", locals, function (err, html, text) {
        if (err) {
          console.log(err);
          callback(false, err);
        } else {
          if (smtpTransport) {
            smtpTransport.sendMail({
              from: config.email.from,
              to: locals.email,
              subject: "There was an error in the app",
              html: html
            }, function (err, responseStatus) {
              if (err) {
                console.log(err);
                callback(false, err);
              } else {
                console.log(responseStatus.message);
                callback(true);
              }
            });
          } else {
            callback(false, 'problems with smtpTransport. returning HTTP 500');
          }
        }
      });
    }
  });
}
