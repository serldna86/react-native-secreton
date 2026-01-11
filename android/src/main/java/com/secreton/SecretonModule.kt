package com.secreton

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

import android.util.Base64
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

@ReactModule(name = SecretonModule.NAME)
class SecretonModule(reactContext: ReactApplicationContext) :
  NativeSecretonSpec(reactContext) {

  companion object {
    const val NAME = "Secreton"
  }

  override fun getName(): String {
    return NAME
  }

  override fun encrypt(value: String, key: String): String {
    val salt = ByteArray(16)
    val iv = ByteArray(16)

    val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
    val spec = PBEKeySpec(key.toCharArray(), salt, 100000, 256)
    val tmp = factory.generateSecret(spec)
    val secretKey = SecretKeySpec(tmp.encoded, "AES")

    val cipher = Cipher.getInstance("AES/CBC/PKCS7Padding")
    cipher.init(Cipher.ENCRYPT_MODE, secretKey, IvParameterSpec(iv))

    val encrypted = cipher.doFinal(value.toByteArray())
    return Base64.encodeToString(encrypted, Base64.NO_WRAP)
  }

  override fun decrypt(encrypted: String, key: String): String {
    val salt = ByteArray(16)
    val iv = ByteArray(16)

    val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
    val spec = PBEKeySpec(key.toCharArray(), salt, 100000, 256)
    val tmp = factory.generateSecret(spec)
    val secretKey = SecretKeySpec(tmp.encoded, "AES")

    val cipher = Cipher.getInstance("AES/CBC/PKCS7Padding")
    cipher.init(Cipher.DECRYPT_MODE, secretKey, IvParameterSpec(iv))

    val decoded = Base64.decode(encrypted, Base64.NO_WRAP)
    return String(cipher.doFinal(decoded))
  }
}
