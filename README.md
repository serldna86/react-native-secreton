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

## Usage
**android/app/build.gradle**
```diff
apply from: new File(rootProject.projectDir.parentFile.parentFile, "android/secreton.gradle")

secretonGenerateEnv(project)
```
