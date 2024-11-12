import { createTenantKnex } from '../lib/db';
import { 
    Asset, 
    AssetType, 
    AssetHistory, 
    AssetAssociation,
    CreateAssetRequest, 
    UpdateAssetRequest, 
    CreateAssetAssociationRequest,
    AssetQueryParams, 
    AssetListResponse 
} from '../interfaces/asset.interfaces';

export class AssetTypeModel {
    static async create(data: Omit<AssetType, 'tenant' | 'type_id' | 'created_at' | 'updated_at'>): Promise<AssetType> {
        const { knex, tenant } = await createTenantKnex();
        const [assetType] = await knex('asset_types')
            .insert({
                ...data,
                tenant,
            })
            .returning('*');
        return assetType;
    }

    static async findById(type_id: string): Promise<AssetType | null> {
        const { knex, tenant } = await createTenantKnex();
        const assetType = await knex('asset_types')
            .where({ tenant, type_id })
            .first();
        return assetType || null;
    }

    static async update(type_id: string, data: Partial<AssetType>): Promise<AssetType> {
        const { knex, tenant } = await createTenantKnex();
        const [assetType] = await knex('asset_types')
            .where({ tenant, type_id })
            .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
            .returning('*');
        return assetType;
    }

    static async list(): Promise<AssetType[]> {
        const { knex, tenant } = await createTenantKnex();
        return knex('asset_types').where({ tenant });
    }

    static async delete(type_id: string): Promise<void> {
        const { knex, tenant } = await createTenantKnex();
        await knex('asset_types')
            .where({ tenant, type_id })
            .delete();
    }
}

export class AssetModel {
    static async create(data: CreateAssetRequest): Promise<Asset> {
        const { knex, tenant } = await createTenantKnex();
        const [asset] = await knex('assets')
            .insert({
                ...data,
                tenant,
            })
            .returning('*');
        return asset;
    }

    static async findById(asset_id: string): Promise<Asset | null> {
        const { knex, tenant } = await createTenantKnex();
        const asset = await knex('assets')
            .where({ tenant, asset_id })
            .first();
        return asset || null;
    }

    static async update(asset_id: string, data: UpdateAssetRequest): Promise<Asset> {
        const { knex, tenant } = await createTenantKnex();
        const [asset] = await knex('assets')
            .where({ tenant, asset_id })
            .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
            .returning('*');
        return asset;
    }

    static async list(params: AssetQueryParams): Promise<AssetListResponse> {
        const { knex, tenant } = await createTenantKnex();
        const { company_id, type_id, status, search, page = 1, limit = 10 } = params;

        let query = knex('assets').where({ tenant });

        if (company_id) {
            query = query.where('company_id', company_id);
        }
        if (type_id) {
            query = query.where('type_id', type_id);
        }
        if (status) {
            query = query.where('status', status);
        }
        if (search) {
            query = query.where(builder => {
                builder
                    .where('name', 'ilike', `%${search}%`)
                    .orWhere('asset_tag', 'ilike', `%${search}%`)
                    .orWhere('serial_number', 'ilike', `%${search}%`);
            });
        }

        const offset = (page - 1) * limit;
        const [{ count }] = await query.clone().count();
        
        const assets = await query
            .orderBy('created_at', 'desc')
            .offset(offset)
            .limit(limit);

        return {
            assets,
            total: Number(count),
            page,
            limit
        };
    }

    static async delete(asset_id: string): Promise<void> {
        const { knex, tenant } = await createTenantKnex();
        await knex('assets')
            .where({ tenant, asset_id })
            .delete();
    }
}

export class AssetHistoryModel {
    static async create(asset_id: string, changed_by: string, change_type: string, changes: Record<string, any>): Promise<AssetHistory> {
        const { knex, tenant } = await createTenantKnex();
        const [history] = await knex('asset_history')
            .insert({
                tenant,
                asset_id,
                changed_by,
                change_type,
                changes,
            })
            .returning('*');
        return history;
    }

    static async listByAsset(asset_id: string): Promise<AssetHistory[]> {
        const { knex, tenant } = await createTenantKnex();
        return knex('asset_history')
            .where({ tenant, asset_id })
            .orderBy('changed_at', 'desc');
    }
}

export class AssetAssociationModel {
    static async create(data: CreateAssetAssociationRequest, created_by: string): Promise<AssetAssociation> {
        const { knex, tenant } = await createTenantKnex();
        const [association] = await knex('asset_associations')
            .insert({
                ...data,
                tenant,
                created_by,
                created_at: new Date().toISOString(),
            })
            .returning('*');
        return association;
    }

    static async findByAssetAndEntity(
        asset_id: string,
        entity_id: string,
        entity_type: string
    ): Promise<AssetAssociation | null> {
        const { knex, tenant } = await createTenantKnex();
        const association = await knex('asset_associations')
            .where({
                tenant,
                asset_id,
                entity_id,
                entity_type,
            })
            .first();
        return association || null;
    }

    static async listByAsset(asset_id: string): Promise<AssetAssociation[]> {
        const { knex, tenant } = await createTenantKnex();
        return knex('asset_associations')
            .where({ tenant, asset_id })
            .orderBy('created_at', 'desc');
    }

    static async listByEntity(entity_id: string, entity_type: string): Promise<AssetAssociation[]> {
        const { knex, tenant } = await createTenantKnex();
        return knex('asset_associations')
            .where({ tenant, entity_id, entity_type })
            .orderBy('created_at', 'desc');
    }

    static async delete(asset_id: string, entity_id: string, entity_type: string): Promise<void> {
        const { knex, tenant } = await createTenantKnex();
        await knex('asset_associations')
            .where({
                tenant,
                asset_id,
                entity_id,
                entity_type,
            })
            .delete();
    }
}
