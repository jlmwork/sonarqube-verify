#!/usr/bin/env node
'use strict';

// Provide a title to the process in `ps`.
// Due to an obscure Mac bug, do not start this title with any symbol.
process.title = 'sonarqube-verify';

const verifier = require('../lib/sonarqube-verify.js');
const debug = require('debug')('tests');

const pkg = require(process.cwd() + '/package.json');
// treat cases of scoped packages, i.e. @scope/name
const projectKey = pkg.name.replace('@', '').replace('/', ':');

// sonar parameters
const sonarUrl = process.env.SONAR_URL || 'http://localhost:9000';
const sonarLogin = process.env.SONAR_LOGIN || '';
const sonarPassword = process.env.SONAR_PASSWORD || '';
const sonarSkip = process.env.SONAR_SKIP || false;
const gateSkip = process.env.SONAR_GATE_SKIP || false;

const params = {
  'sonar.projectKey': projectKey,
  'sonar.projectVersion': pkg.version,
  'sonar.projectName': pkg.name,
  'sonar.host.url': sonarUrl,
  'sonar.login': sonarLogin,
  'sonar.skip': sonarSkip,
  'sonar.gate.skip': gateSkip,
  'sonar.password': sonarPassword
};

verifier
  .verify(params)
  .then(result => {
    console.log('Verification ended in success');
    console.log(result);
    process.exit(0);
  })
  .catch(err => {
    console.log('Verification ended in error');
    console.error(err);
    if (err.stack) {
      debug(err.stack);
    }
    process.exit(1);
  });
