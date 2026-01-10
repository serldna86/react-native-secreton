require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = package["name"]
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/serldna86/react-native-secreton.git", :tag => "#{s.version}" }
  s.requires_arc = true

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"

  s.script_phase = {
    :name => 'Secreton Env',
    :script => 'bash "${PODS_TARGET_SRCROOT}/../../scripts/secreton-ios.sh"',
    :execution_position => :before_compile
  }

  install_modules_dependencies(s)
end
