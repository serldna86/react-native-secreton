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
react {
    ...
    nodeExecutableAndArgs = [
        project.findProperty("NODE_BINARY") ?: "/usr/local/bin/node"
    ]
    ...
}
...
apply from: new File(rootProject.projectDir.parentFile.parentFile, "android/secreton.gradle")
secretonGenerateEnv(project)
```

### iOS / macOS
Xcode → Target → Build Phases → + → New Run Script Phase
```
bash "${SRCROOT}/secreton.sh"
```

ios/Podfile
```
ENV['ENVFILE'] = '../.env.decoded'
```
