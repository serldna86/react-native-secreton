# react-native-secreton
Config secret variables for React Native apps

## Installation
```sh
npm install react-native-secreton
```

## Generate secret key
Command line random key:
```
openssl rand -hex 32
```

## Native Usage

### Android
Config **android/app/build.gradle**
```groovy
...
apply from: new File(rootProject.projectDir.parentFile.parentFile, "android/secreton.gradle")
loadEnvFromSecretonCliSync(project)
...
react {
    ...
    nodeExecutableAndArgs = [
        project.findProperty("NODE_BINARY") ?: "/usr/local/bin/node"
    ]
    ...
}
android {
    defaultConfig {
        manifestPlaceholders = [
            geoApiKey           : project.ext.env?.get('GEO_APK_API_KEY')
        ]
    }
}
```

### iOS / macOS
- Manual Link
```
pod 'react-native-secreton', :path => '../node_modules/react-native-secreton'
```
