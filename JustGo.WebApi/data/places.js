'use strict';

var Place = require('mongoose').model('Place');
var Promise = require('bluebird');

module.exports = {
  create: function(place) {
    var promise = new Promise(function(resolve, reject) {
      Place.create(place, function(err, dbPlace) {
        if (err) {
          reject(err);
        }

        if (!dbPlace) {
          reject('Place could not be saved in database!');
        }

        resolve(dbPlace);
      });
    });

    return promise;
  }
};
