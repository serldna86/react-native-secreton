#import "Secreton.h"

#import <CommonCrypto/CommonCrypto.h>

@implementation Secreton

+ (NSString *)moduleName
{
  return @"Secreton";
}

#pragma mark - TurboModule methods

- (NSString *)encrypt:(NSString *)value key:(NSString *)key
{
    return [self aes:kCCEncrypt value:value key:key];
}

- (NSString *)decrypt:(NSString *)value key:(NSString *)key
{
    return [self aes:kCCDecrypt value:value key:key];
}

#pragma mark - AES core

- (NSString *)aes:(CCOperation)operation
            value:(NSString *)value
              key:(NSString *)key
{
  NSData *data = [value dataUsingEncoding:NSUTF8StringEncoding];

  // FIX: key 32 byte (AES-256)
  NSMutableData *keyData = [NSMutableData dataWithLength:kCCKeySizeAES256];
  NSData *rawKey = [key dataUsingEncoding:NSUTF8StringEncoding];
  NSUInteger copyLen = MIN(rawKey.length, kCCKeySizeAES256);
  memcpy(keyData.mutableBytes, rawKey.bytes, copyLen);

  size_t outLength = 0;
  NSMutableData *outData = [NSMutableData dataWithLength:data.length + kCCBlockSizeAES128];

  CCCryptorStatus status = CCCrypt(
    operation,
    kCCAlgorithmAES,
    kCCOptionPKCS7Padding,
    keyData.bytes,
    kCCKeySizeAES256,
    NULL, // IV = zero (compat Swift)
    data.bytes,
    data.length,
    outData.mutableBytes,
    outData.length,
    &outLength
  );

  if (status != kCCSuccess) {
    return nil;
  }

  outData.length = outLength;

  if (operation == kCCEncrypt) {
    return [outData base64EncodedStringWithOptions:0];
  }

  return [[NSString alloc] initWithData:outData encoding:NSUTF8StringEncoding];
}

#pragma mark - TurboModule binding

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeSecretonSpecJSI>(params);
}

@end
