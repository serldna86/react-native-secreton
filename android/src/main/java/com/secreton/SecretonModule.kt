package com.secreton

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import android.util.Base64
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

@ReactModule(name = SecretonModule.NAME)
class SecretonModule(
  reactContext: ReactApplicationContext
) : NativeSecretonSpec(reactContext) {

  companion object {
    const val NAME = "Secreton"
    private const val PREFIX = "$NAME:"
    private const val ITERATIONS = 100_000
  }

  override fun getName() = NAME

  override fun encrypt(value: String): String {
    val encrypted = encryptOpenSSL(value, getSecretKey())
    return PREFIX + encrypted
  }

  override fun decrypt(value: String): String {
    if (!value.startsWith(PREFIX)) return value
    return decryptOpenSSL(value.removePrefix(PREFIX), getSecretKey())
  }

  private fun getSecretKey(): String {
    return BuildConfig.ENV_SECRET_KEY
  }

  private fun encryptOpenSSL(value: String, key: String): String {
    val salt = ByteArray(8)
    SecureRandom().nextBytes(salt)

    val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
    val spec = PBEKeySpec(
      key.toCharArray(),
      salt,
      ITERATIONS,
      (32 + 16) * 8 // key + iv in bits
    )

    val keyIv = factory.generateSecret(spec).encoded
    val aesKey = SecretKeySpec(keyIv.copyOfRange(0, 32), "AES")
    val iv = IvParameterSpec(keyIv.copyOfRange(32, 48))

    val cipher = Cipher.getInstance("AES/CBC/PKCS7Padding")
    cipher.init(Cipher.ENCRYPT_MODE, aesKey, iv)

    val encrypted = cipher.doFinal(value.toByteArray(Charsets.UTF_8))

    val output = ByteArray(16 + encrypted.size)
    System.arraycopy("Salted__".toByteArray(), 0, output, 0, 8)
    System.arraycopy(salt, 0, output, 8, 8)
    System.arraycopy(encrypted, 0, output, 16, encrypted.size)

    return Base64.encodeToString(output, Base64.NO_WRAP)
  }

  private fun decryptOpenSSL(encrypted: String, key: String): String {
    val decoded = Base64.decode(encrypted, Base64.NO_WRAP)

    val magic = String(decoded.copyOfRange(0, 8))
    if (magic != "Salted__") {
      throw IllegalArgumentException("Invalid OpenSSL salt header")
    }

    val salt = decoded.copyOfRange(8, 16)
    val cipherText = decoded.copyOfRange(16, decoded.size)

    val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
    val spec = PBEKeySpec(
      key.toCharArray(),
      salt,
      ITERATIONS,
      (32 + 16) * 8
    )

    val keyIv = factory.generateSecret(spec).encoded
    val aesKey = SecretKeySpec(keyIv.copyOfRange(0, 32), "AES")
    val iv = IvParameterSpec(keyIv.copyOfRange(32, 48))

    val cipher = Cipher.getInstance("AES/CBC/PKCS7Padding")
    cipher.init(Cipher.DECRYPT_MODE, aesKey, iv)

    return String(cipher.doFinal(cipherText), Charsets.UTF_8)
  }
}
