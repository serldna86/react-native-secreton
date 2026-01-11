package secreton.example

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ConfigModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "Config"

  @ReactMethod
  fun getEnv(promise: Promise) {
    try {
      val map = Arguments.createMap()
      map.putString("SECRETON_KEY", BuildConfig.SECRETON_KEY)
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("ENV_ERROR", e)
    }
  }
}
