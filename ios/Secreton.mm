#import "Secreton.h"

#import <CommonCrypto/CommonCrypto.h>

@implementation Secreton

static NSString * const kPrefix = @"Secreton:";

+ (NSString *)moduleName
{
  return @"Secreton";
}

#pragma mark - TurboModule methods

- (NSString *)encrypt:(NSString *)value
{
  NSString *key = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"ENV_SECRET_KEY"];
  if (!key || key.length == 0) {
    return nil;
  }

  NSString *encrypted = [self aes:kCCEncrypt value:value key:key];
  return [kPrefix stringByAppendingString:encrypted];
}

- (NSString *)decrypt:(NSString *)value
{
  if (![value hasPrefix:kPrefix]) {
    return value;
  }
  
  NSString *key = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"ENV_SECRET_KEY"];
  if (!key || key.length == 0) {
    return nil;
  }

  NSString *raw = [value substringFromIndex:kPrefix.length];
  return [self aes:kCCDecrypt value:raw key:key];
}

#pragma mark - AES core

- (NSString *)aes:(CCOperation)operation
            value:(NSString *)value
              key:(NSString *)key
{
  NSData *data = nil;

  if (operation == kCCEncrypt) {
    data = [value dataUsingEncoding:NSUTF8StringEncoding];
  } else {
    data = [[NSData alloc] initWithBase64EncodedString:value options:0];
    if (!data) return nil;
  }

  // Key 32 byte (AES-256)
  NSMutableData *keyData = [NSMutableData dataWithLength:kCCKeySizeAES256];
  NSData *rawKey = [key dataUsingEncoding:NSUTF8StringEncoding];
  memcpy(keyData.mutableBytes, rawKey.bytes, MIN(rawKey.length, kCCKeySizeAES256));

  size_t outLength = 0;
  NSMutableData *outData = [NSMutableData dataWithLength:data.length + kCCBlockSizeAES128];

  CCCryptorStatus status = CCCrypt(
    operation,
    kCCAlgorithmAES,
    kCCOptionPKCS7Padding,
    keyData.bytes,
    kCCKeySizeAES256,
    NULL, // IV zero
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
