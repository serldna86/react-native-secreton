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

## Setup
Link the library:
```
$ react-native link react-native-config
```

- Manual Link (Android) 

**android/settings.gradle**
```diff
+ include ':react-native-secreton'
+ project(':react-native-secreton').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-secreton/android')
```

**android/app/build.gradle**

```diff
+ apply from: new File(rootProject.projectDir.parentFile.parentFile, "android/secreton.gradle")
+ loadEnvFromSecretonCliSync(project)

```

- Manual Link (iOS / macOS)
```diff
+ pod 'react-native-secreton', :path => '../node_modules/react-native-secreton'
```

## Native Usage

### Android
```groovy
project.ext.env?.get('API_KEY')
```

### iOS / macOS
1. Include xcconfig in the project

project.pbxproj or Podfile, add:
```ruby
ENVFILE = File.join("..", "..", ".env")
generated = File.join("..", "Secreton.xcconfig")
```

Then in Xcode build settings:
```code
#include? "Secreton.xcconfig"
```

2. Use on native iOS (Objective‑C/Swift)
```objective‑c
let apiKey = ProcessInfo.processInfo.environment["GEO_APK_API_KEY"]

or

let apiKey = Bundle.main.object(forInfoDictionaryKey: "GEO_APK_API_KEY") as? String
```
