const sonarqube = require('../lib/sonarqube');
const debug = require('debug')('tests');

sonarqube
  .check(process.env.SONAR_LOGIN, process.env.SONAR_PASSWORD, 10)
  // .check()
  .then(() => {
    console.log('end');
  })
  .catch(err => {
    if (err.errno == '-4058') {
      console.error(
        'The required report file ' +
          reportStatus.reportFile +
          ' was not found.'
      );
      debug('Details : ', err.stack);
    } else {
      console.error(err);
    }
  });
