/**
 * Created by brunosiqueira on 29/02/16.
 */
  var emailTemplates = require('email-templates'),
  nodemailer = require('nodemailer'),
  config = require('../config'),
  path = require('path'),
  templatesDir = path.resolve(__dirname, '..', 'templates'),
  _ = require('lodash'),
  smtpTransportObj = nodemailer.createTransport({
    service: config.email.service,
    host: config.email.host,
    port: config.email.port,
    secure: !config.email.startTls,
    auth: {
      type: config.email.authMethod,
      method: config.email.authMethod,
      user: config.email.user,
      pass: config.email.pass
    }
  }),
  emailTemplate = new emailTemplates({
    message: {
      from: config.email.from
    },
    transport: smtpTransportObj,
    views: {
      options: {
        extension: 'ejs'
      }
    }
  });

var emailManager  = {};

_sendTemplatedEmail = function(template, locals, callback) {
  emailTemplate.send({
    template: path.join(templatesDir, template),
    message: {
      from: config.email.from,
      to: locals.email,
      subject: locals.subject
    },
    locals: locals
  }).then(function(resp) {
    console.log(resp);
    callback(true);
  }).catch(function(err) {
    console.log(err);
    callback(false, err);
  });
};

emailManager.sendEmailExportSuccess = function(email, downloadUrl, username, callback) {
  _sendTemplatedEmail("export", {
      email: email,
      subject: "Video export is ready",
      username: username,
      downloadUrl: downloadUrl
    }, callback);
};

emailManager.sendEmailErrorExport = function(email, username, callback) {
  _sendTemplatedEmail("errorExport", {
      email: email,
      subject: "There was an error exporting your videos",
      username: username
    }, callback);
};

emailManager.sendEmailForgotPassword = function(email, accessUrl, username, callback) {
  _sendTemplatedEmail("forgotPass", {
      email: email,
      subject: "New Password",
      username: username,
      accessUrl: accessUrl
    }, callback);
};

emailManager.sendEmailAdmError = function(error, username, callback) {
  _sendTemplatedEmail("errorAdm", {
      email: config.email.administrator,
      subject: "There was an error in the app",
      username: username,
      error: JSON.stringify(error)
    }, callback);
};

module.exports = emailManager;
