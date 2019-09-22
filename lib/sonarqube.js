#!/usr/bin/env node
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const debug = require('debug')('sonarqube:verify:status');

const REPORT_FILE = '.scannerwork/report-task.txt';
const DEFAULT_DELAY = 5;

module.exports.reportFile = REPORT_FILE;
module.exports.checkQualityGateStatus = checkQualityGateStatus;

function checkQualityGateStatus(params) {
  const login = params['sonar.login'];
  const password = params['sonar.password'] || '';
  params['sonar.host.url'] = params['sonar.host.url'].trim();
  if(!params['sonar.host.url'].endsWith('/')) {
    params['sonar.host.url']+= '/'
  }
  const gateUrl =
    params['sonar.host.url'] +
    'api/qualitygates/project_status?projectKey=' +
    params['sonar.projectKey'];

  return checkReportStatus(login, password).then(reportStatus => {
    debug('reportStatus : ' + reportStatus);
    console.log('Check the Quality gate ' + gateUrl);
    const srvUrl = url.parse(gateUrl);
    console.log(`Protocol = ${srvUrl.protocol }`);
    const requestModule = (srvUrl.protocol.startsWith('https')) ? https : http;
    const options = {};
    addAuthHeader(options, login, password);
    return new Promise((resolve, reject) => {
      const req = requestModule.request(gateUrl, options, response => {
        if (response.statusCode !== 200) {
          console.error('Error requesting the Report status');
          reject('SonarQube replied the status code ' + response.statusCode);
        } else {
          let body = '';
          response.on('data', function(chunk) {
            body += chunk;
          });
          req.on('error', function(err) {
            console.error('Error requesting the Quality Gate status');
            reject(err);
          });
          response.on('end', function() {
            processGateResponse(body, resolve, reject);
          });
        }
      });
      req.end();
    });
  });
}

function processGateResponse(body, resolve, reject) {
  const gateResponse = JSON.parse(body);
  const status = gateResponse.projectStatus.status;
  console.log('QUALITY GATE STATUS : ' + status);
  if (status != 'OK' && status != 'WARN') {
    console.error('QUALITY GATE HAS FAILED');
    const errors = gateResponse.projectStatus.conditions
      .filter(cond => cond.status == 'ERROR')
      .map(
        cond =>
          `[${cond.metricKey}]: ${cond.actualValue} ${cond.comparator} ${cond.errorThreshold}`
      )
      .join(', ');
    debug(errors);
    reject(errors);
  }
  resolve('OK');
}

// TODO : max checks ?
/**
 *
 * @param {*} login login to the SonarQube API. Use it too for tokens. Let it empty or undefined if no authentication is required.
 * @param {*} password password to the SonarQube API. Use empty value for tokens.
 * @param {*} delayBetweenChecksInSecs Defaults to 5
 */
function checkReportStatus(
  login,
  password = '',
  delayBetweenChecksInSecs = DEFAULT_DELAY
) {
  return new Promise((resolve, reject) => {
    const reportInfo = fs.readFileSync(REPORT_FILE, 'utf8');
    const taskUrl = reportInfo.match(/ceTaskUrl=(.*)/)[1];
    console.log('Report Status Url : ' + taskUrl);
    const srvUrl = url.parse(taskUrl);
    console.log(`Protocol = ${srvUrl.protocol }`);
    const requestModule = (srvUrl.protocol.startsWith('https')) ? https : http;
    const options = {};
    addAuthHeader(options, login, password);

    const req = requestModule.request(taskUrl, options, response => {
      if (response.statusCode !== 200) {
        console.error('Error requesting the Report status');
        reject('SonarQube replied the status code ' + response.statusCode);
      } else {
        let body = '';
        response.on('data', function(chunk) {
          body += chunk;
        });
        req.on('error', function(err) {
          console.error('Error requesting the Report status');
          reject(err);
        });
        response.on('end', function() {
          debug('Raw response from SonarQube API');
          debug('"' + body + '"');
          // on first call, API response might be empty
          if (body === '') {
            resolve('');
          } else {
            const taskResponse = JSON.parse(body);
            resolve(taskResponse.task.status);
          }
        });
      }
    });
    req.end();
  }).then(status => {
    console.log('Report status : ' + status);
    if (status === '' || status === 'IN_PROGRESS' || status === 'PENDING') {
      console.log(
        'Retry until report ends in ' + delayBetweenChecksInSecs + 's'
      );
      return delay(delayBetweenChecksInSecs * 1000).then(() => {
        return checkReportStatus(login, password, delayBetweenChecksInSecs);
      });
    } else {
      return status;
    }
  });
}

function addAuthHeader(options, login, password) {
  let auth = null;
  if (login !== '' && login !== undefined) {
    debug('Authentication active');
    auth = 'Basic ' + new Buffer(login + ':' + password).toString('base64');
  } else {
    debug('No authentication active');
  }
  if (auth) {
    options.headers = {
      Authorization: auth
    };
  }
}

// Add delay in the promise chain
function delay(t) {
  return new Promise(function(resolve) {
    setTimeout(resolve, t);
  });
}
