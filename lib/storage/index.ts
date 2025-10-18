import { IStorageProvider } from './types';
import { LocalStorage } from './local-storage';
import { CloudStorage } from './cloud-storage';
import { STORAGE_TYPE } from '@/lib/utils/constants';

/**
 * Storage abstraction layer
 *
 * Provides a unified interface for file storage,
 * supporting both local filesystem and cloud storage (R2/S3).
 */

let storageInstance: IStorageProvider | null = null;

function getStorage(): IStorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  if (STORAGE_TYPE === 'cloud') {
    storageInstance = new CloudStorage();
  } else {
    storageInstance = new LocalStorage();
  }

  return storageInstance;
}

export const storage = getStorage();

export type { IStorageProvider };
export { LocalStorage, CloudStorage };
