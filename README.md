# sonarqube-verify
Launch SonarQube analysis using the sonarqube-scanner npm module by @bellingard : https://github.com/bellingard/sonar-scanner-npm then it check the Quality Gate status after report has ended.

Tested with [SonarQube 6.5](https://docs.sonarqube.org/display/SONAR/Documentation)

## Usage

### Installation
```
npm install -D sonarqube-verify
```

### Execution (CLI)
Insert a script into your package.json :
```
"scripts" : {
    "verify": "sonarqube-verify"
}
```

#### Configuration
You can use a sonar-project.properties file at your root folder.

Look at [Analysis Parameters](https://docs.sonarqube.org/display/SONAR/Analysis+Parameters) for available values.

#### Configuration (CLI)
Best practices are to not set critical settings in your repository.

For example committing the login token into your sonar-project.properties sould absolutely be avoided.

This module allows you to use the following environment variables to provide runtime parameters :
 - ```SONAR_URL``` : Url of your SonarQube server. Defaults to http://localhost:9000
 - ```SONAR_LOGIN``` : token or login (in latter case you must not set a password)
 - ```SONAR_PASSWORD``` : (in case you are not using authentication token but you should)
 - ```SONAR_SKIP``` : to disable the sonar analysis
 - ```SONAR_GATE_SKIP``` : in case you would like to disable the quality check.


#### Sample Configuration

```
sonar.sources=src
sonar.sourceEncoding=UTF-8
sonar.exclusions=**/node_modules/**
```

Then run the verify :
```
export SONAR_URL=http://myhost.com/sonar
export SONAR_LOGIN=01234567890123456
npm run verify
```

You can activate debug logs with the DEBUG environment variable (using the [debug package](https://github.com/visionmedia/debug)) :
```
DEBUG=* npm run verify
```

or more accurately :
```
DEBUG=sonarqube-verify:* npm run verify
```
