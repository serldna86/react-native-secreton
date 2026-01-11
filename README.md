# react-native-secreton
A library for managing **secret environment variables** in React Native apps. 
Supports integration with **Consul** and **Vault** to securely retrieve configurations.

## Installation
```bash
npm install react-native-secreton
# or
yarn add react-native-secreton
```

## Generate secret key
Command line random key:
```
openssl rand -hex 32
```

## Setup
Link the library:
```
$ react-native link react-native-secreton
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

## Usage Examples

### Using Consul
```bash
export ENV_SECRET_KEY=secret-key-32-bytes
export FETCH_ENV=consul
export CONSUL_ADDR=http://consul.mycompany.com:8500
export CONSUL_PATH=mobile/myapp
export CONSUL_TOKEN=abcd1234

rn-secreton-cli .env
```

### Using Vault
```bash
export ENV_SECRET_KEY=secret-key-32-bytes
export FETCH_ENV=vault
export VAULT_ADDR=http://vault.mycompany.com:8200
export VAULT_PATH=secret/data/mobile/myapp
export VAULT_TOKEN=abcd1234

rn-secreton-cli .env
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
# or
let apiKey = Bundle.main.object(forInfoDictionaryKey: "GEO_APK_API_KEY") as? String
```
