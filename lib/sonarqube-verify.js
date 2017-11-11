#!/usr/bin/env node
const http = require('http');
const url = require('url');
const fs = require('fs');
const debug = require('debug')('sonarqube:verify');
const scanner = require('sonarqube-scanner').cli;
const sonarqube = require('./sonarqube');

module.exports.verify = verify;

function verify(sonarParams = {}) {
  var options = [];
  if (process.argv.length > 2) {
    options = process.argv.slice(2);
  }
  const sonarSkip = sonarParams['sonar.skip'] || false;
  const gateSkip = sonarParams['sonar.gate.skip'] || false;

  // delete properties unknown of sonarqube scanner
  delete sonarParams['sonar.skip'];
  delete sonarParams['sonar.gate.skip'];

  debug('SonarQube params', sonarParams);
  process.env.SONARQUBE_SCANNER_PARAMS = JSON.stringify(sonarParams);

  return new Promise((resolve, reject) => {
    if (!sonarSkip) {
      scanner(options, {}, () => {
        resolve('Scan OK');
      });
    } else {
      console.log('SonarQube analysis disabled');
    }
  }).then(() => {
    if (!sonarSkip && !gateSkip) {
      return sonarqube.checkQualityGateStatus(sonarParams, sonarPassword);
    } else {
      console.log('Quality Gate check disabled');
    }
  });
}
