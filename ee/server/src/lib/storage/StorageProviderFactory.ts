// import { StorageProviderInterface, StorageProviderConfig } from '@/lib/storage/providers/StorageProvider';
// import { StorageProvider } from '@/types/storage';
// import { S3StorageProvider } from './providers/S3StorageProvider';
// import { StorageProviderFactory as CEStorageProviderFactory } from '@/lib/storage/StorageProviderFactory';

// export class StorageProviderFactory extends CEStorageProviderFactory {
//     protected static override createProviderInstance(
//         providerRecord: StorageProvider
//     ): StorageProviderInterface {
//         this.validateProviderConfig(providerRecord.config, providerRecord.provider_type);

//         switch (providerRecord.provider_type) {
//             case 's3':
//                 return new S3StorageProvider(providerRecord.config);
//             default:
//                 try {
//                     // Try CE providers first
//                     return super.createProviderInstance(providerRecord);
//                 } catch (error) {
//                     throw new Error(`Unsupported storage provider type: ${providerRecord.provider_type}`);
//                 }
//         }
//     }

//     protected static override validateProviderConfig(
//         config: StorageProviderConfig,
//         providerType: string
//     ): void {
//         switch (providerType) {
//             case 's3': {
//                 const { region, bucket, access_key, secret_key } = config.s3 || {};
//                 if (!region || !bucket || !access_key || !secret_key) {
//                     throw new Error('Invalid S3 configuration: missing required fields');
//                 }
//                 break;
//             }
//             default:
//                 try {
//                     // Try CE validation for other provider types
//                     super.validateProviderConfig(config, providerType);
//                 } catch (error) {
//                     throw new Error(`Unsupported storage provider type: ${providerType}`);
//                 }
//         }
//     }
// }

// // Re-export the helper function
// export { generateStoragePath } from '@/lib/storage/StorageProviderFactory';
