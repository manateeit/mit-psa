import { createTenantKnex } from '../lib/db';
import { FileStore } from '../types/storage';

export class FileStoreModel {
    static async create(data: Omit<FileStore, 'tenant' | 'file_id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by'>): Promise<FileStore> {
        const { knex, tenant } = await createTenantKnex();
        const [file] = await knex('file_stores')
            .insert({
                ...data,
                tenant,
            })
            .returning('*');
        return file;
    }

    static async findById(file_id: string): Promise<FileStore | null> {
        const { knex, tenant } = await createTenantKnex();
        const file = await knex('file_stores')
            .where({ tenant, file_id, is_deleted: false })
            .first();
        return file || null;
    }

    static async softDelete(file_id: string, deleted_by: string): Promise<FileStore> {
        const { knex, tenant } = await createTenantKnex();
        const [file] = await knex('file_stores')
            .where({ tenant, file_id })
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by,
            })
            .returning('*');
        return file;
    }

    static async list(): Promise<FileStore[]> {
        const { knex, tenant } = await createTenantKnex();
        return knex('file_stores').where({ tenant, is_deleted: false });
    }
}
