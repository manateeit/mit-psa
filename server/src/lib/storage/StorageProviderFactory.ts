import { StorageProviderInterface } from './providers/StorageProvider';
import { LocalProviderConfig, S3ProviderConfig } from '../../types/storage';
import { getStorageConfig } from '../../config/storage';
import { S3StorageProvider } from '@ee/lib/storage/providers/S3StorageProvider';
import { LocalStorageProvider } from './providers/LocalStorageProvider';

export class StorageProviderFactory {
    private static provider: StorageProviderInterface | null = null;

    static createProvider(): StorageProviderInterface {
        // Singleton pattern - return existing provider if already created
        if (this.provider) {
            return this.provider;
        }

        const config = getStorageConfig();
        
        switch (config.defaultProvider) {
            case 'local': {
                const localConfig = config.providers.local as LocalProviderConfig;
                this.provider = new LocalStorageProvider(localConfig);
                break;
            }
            case 's3': {
                const s3Config = config.providers.s3 as S3ProviderConfig;
                this.provider = new S3StorageProvider(s3Config);
                break;
            }
            default:
                throw new Error(`Unsupported storage provider type: ${config.defaultProvider}`);
        }

        return this.provider;
    }

    static clearProvider(): void {
        this.provider = null;
    }
}

// Helper function to generate a unique path for a file
export function generateStoragePath(
    tenant: string,  // We still need tenant for path organization
    base_path: string,
    original_filename: string
): string {
    console.log('Generating storage path:', { tenant, base_path, original_filename });
    
    const timestamp = Date.now();
    console.log('Generated timestamp:', timestamp);
    
    const random = Math.random().toString(36).substring(2, 15);
    console.log('Generated random string:', random);
    
    const extension = original_filename.split('.').pop() || '';
    console.log('Extracted file extension:', extension);
    
    const path = `${base_path}/${tenant}/${timestamp}-${random}.${extension}`.replace(/\/+/g, '/');
    console.log('Final generated path:', path);
    
    return path;
}
