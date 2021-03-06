'use strict';

var User = require('mongoose').model('User');
var Promise = require('bluebird');

module.exports = {
  create: function(user) {
    var promise = new Promise(function(resolve, reject) {
      User.create(user, function(err, dbUser) {
        if (err) {
          if (err.code === 11000) {
            reject('Username has already been taken!');
          } else {
            reject(err);
          }
        }

        if (!dbUser) {
          reject('User could not be saved in database!');
        }

        resolve(dbUser);
      });
    });

    return promise;
  },
  findByUsername: function(username) {
   var promise = new Promise(function(resolve, reject) {
      User.findOne({ username: username }).exec(function (err, dbUser) {
        if (err) {
          reject(err);
        }

        if (!dbUser) {
          reject('Username does not exist!');
        }

        resolve(dbUser);
      });
   });

   return promise;
  },
  findByToken: function (token) {
    var promise = new Promise(function(resolve, reject) {
      User.findOne({ accessToken: token }).exec(function (err, dbUser) {
        if (err) {
          reject(err);
        }

        if (!dbUser) {
          reject('Unauthorised!');
        }

        resolve(dbUser);
      });
   });

   return promise;
  }
};
