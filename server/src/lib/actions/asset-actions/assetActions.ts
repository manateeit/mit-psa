'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AssetModel, AssetTypeModel, AssetHistoryModel, AssetAssociationModel } from '../../../models/asset';
import { 
    CreateAssetRequest, 
    UpdateAssetRequest, 
    AssetQueryParams,
    CreateAssetTypeRequest,
    CreateAssetAssociationRequest,
    Asset,
    AssetType,
    AssetListResponse,
    AssetHistory,
    AssetAssociation
} from '../../../interfaces/asset.interfaces';
import { validateData } from '@/lib/utils/validation';
import {
    assetSchema,
    assetTypeSchema,
    assetHistorySchema,
    assetAssociationSchema,
    createAssetSchema,
    createAssetTypeSchema,
    createAssetAssociationSchema,
    updateAssetSchema,
    assetQuerySchema,
    assetListResponseSchema
} from '@/lib/schemas/asset.schema';
import { getCurrentUser } from '../user-actions/userActions';

// Existing asset actions
export async function createAsset(data: CreateAssetRequest): Promise<Asset> {
    try {
        // Validate the input data
        const validatedData = validateData(createAssetSchema, data);
        
        const asset = await AssetModel.create(validatedData);
        await AssetHistoryModel.create(
            asset.asset_id,
            'system', // TODO: Get actual user ID
            'created',
            { ...validatedData }
        );
        revalidatePath('/assets');
        
        // Validate the response
        return validateData(assetSchema, asset);
    } catch (error) {
        console.error('Error creating asset:', error);
        throw new Error('Failed to create asset');
    }
}

export async function updateAsset(asset_id: string, data: UpdateAssetRequest): Promise<Asset> {
    try {
        // Validate the update data
        const validatedData = validateData(updateAssetSchema, data);
        
        const asset = await AssetModel.update(asset_id, validatedData);
        await AssetHistoryModel.create(
            asset_id,
            'system', // TODO: Get actual user ID
            'updated',
            { ...validatedData }
        );
        revalidatePath('/assets');
        revalidatePath(`/assets/${asset_id}`);
        
        // Validate the response
        return validateData(assetSchema, asset);
    } catch (error) {
        console.error('Error updating asset:', error);
        throw new Error('Failed to update asset');
    }
}

export async function deleteAsset(asset_id: string): Promise<void> {
    try {
        // Validate asset_id
        validateData(z.object({ asset_id: z.string().uuid() }), { asset_id });
        
        await AssetModel.delete(asset_id);
        revalidatePath('/assets');
    } catch (error) {
        console.error('Error deleting asset:', error);
        throw new Error('Failed to delete asset');
    }
}

export async function getAsset(asset_id: string): Promise<Asset | null> {
    try {
        // Validate asset_id
        validateData(z.object({ asset_id: z.string().uuid() }), { asset_id });
        
        const asset = await AssetModel.findById(asset_id);
        if (!asset) return null;
        
        // Validate the response
        return validateData(assetSchema, asset);
    } catch (error) {
        console.error('Error getting asset:', error);
        throw new Error('Failed to get asset');
    }
}

export async function listAssets(params: AssetQueryParams): Promise<AssetListResponse> {
    try {
        // Validate query parameters
        const validatedParams = validateData(assetQuerySchema, params);
        
        const response = await AssetModel.list(validatedParams);
        
        // Validate each asset in the response
        const validatedAssets = response.assets.map((asset): Asset => 
            validateData(assetSchema, asset)
        );
        
        return validateData(assetListResponseSchema, {
            ...response,
            assets: validatedAssets
        });
    } catch (error) {
        console.error('Error listing assets:', error);
        throw new Error('Failed to list assets');
    }
}

// Asset type actions
export async function createAssetType(data: CreateAssetTypeRequest): Promise<AssetType> {
    try {
        // Validate the input data
        const validatedData = validateData(createAssetTypeSchema, data);
        
        const assetType = await AssetTypeModel.create(validatedData);
        revalidatePath('/assets/types');
        
        // Validate the response
        return validateData(assetTypeSchema, assetType);
    } catch (error) {
        console.error('Error creating asset type:', error);
        throw new Error('Failed to create asset type');
    }
}

export async function updateAssetType(type_id: string, data: Partial<AssetType>): Promise<AssetType> {
    try {
        // Validate type_id and update data
        validateData(z.object({ type_id: z.string().uuid() }), { type_id });
        const validatedData = validateData(assetTypeSchema.partial(), data);
        
        const assetType = await AssetTypeModel.update(type_id, validatedData);
        revalidatePath('/assets/types');
        revalidatePath(`/assets/types/${type_id}`);
        
        // Validate the response
        return validateData(assetTypeSchema, assetType);
    } catch (error) {
        console.error('Error updating asset type:', error);
        throw new Error('Failed to update asset type');
    }
}

export async function deleteAssetType(type_id: string): Promise<void> {
    try {
        // Validate type_id
        validateData(z.object({ type_id: z.string().uuid() }), { type_id });
        
        await AssetTypeModel.delete(type_id);
        revalidatePath('/assets/types');
    } catch (error) {
        console.error('Error deleting asset type:', error);
        throw new Error('Failed to delete asset type');
    }
}

export async function getAssetType(type_id: string): Promise<AssetType | null> {
    try {
        // Validate type_id
        validateData(z.object({ type_id: z.string().uuid() }), { type_id });
        
        const assetType = await AssetTypeModel.findById(type_id);
        if (!assetType) return null;
        
        // Validate the response
        return validateData(assetTypeSchema, assetType);
    } catch (error) {
        console.error('Error getting asset type:', error);
        throw new Error('Failed to get asset type');
    }
}

export async function listAssetTypes(): Promise<AssetType[]> {
    try {
        const assetTypes = await AssetTypeModel.list();
        
        // Validate each asset type in the response
        return assetTypes.map((assetType): AssetType => 
            validateData(assetTypeSchema, assetType)
        );
    } catch (error) {
        console.error('Error listing asset types:', error);
        throw new Error('Failed to list asset types');
    }
}

// New asset association actions
export async function createAssetAssociation(data: CreateAssetAssociationRequest): Promise<AssetAssociation> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('No user session found');
        }

        // Validate the input data
        const validatedData = validateData(createAssetAssociationSchema, data);
        
        const association = await AssetAssociationModel.create(validatedData, currentUser.user_id);
        
        // Revalidate relevant paths
        revalidatePath('/assets');
        if (data.entity_type === 'ticket') {
            revalidatePath(`/tickets/${data.entity_id}`);
        }
        
        // Validate the response
        return validateData(assetAssociationSchema, association);
    } catch (error) {
        console.error('Error creating asset association:', error);
        throw new Error('Failed to create asset association');
    }
}

export async function listAssetAssociations(asset_id: string): Promise<AssetAssociation[]> {
    try {
        // Validate asset_id
        validateData(z.object({ asset_id: z.string().uuid() }), { asset_id });
        
        const associations = await AssetAssociationModel.listByAsset(asset_id);
        
        // Validate each association in the response
        return associations.map((association): AssetAssociation => 
            validateData(assetAssociationSchema, association)
        );
    } catch (error) {
        console.error('Error listing asset associations:', error);
        throw new Error('Failed to list asset associations');
    }
}

export async function listEntityAssets(entity_id: string, entity_type: string): Promise<AssetAssociation[]> {
    try {
        // Validate parameters
        validateData(
            z.object({
                entity_id: z.string().uuid(),
                entity_type: z.enum(['ticket', 'project'])
            }),
            { entity_id, entity_type }
        );
        
        const associations = await AssetAssociationModel.listByEntity(entity_id, entity_type);
        
        // Validate each association in the response
        return associations.map((association): AssetAssociation => 
            validateData(assetAssociationSchema, association)
        );
    } catch (error) {
        console.error('Error listing entity assets:', error);
        throw new Error('Failed to list entity assets');
    }
}

export async function removeAssetAssociation(
    asset_id: string,
    entity_id: string,
    entity_type: string
): Promise<void> {
    try {
        // Validate parameters
        validateData(
            z.object({
                asset_id: z.string().uuid(),
                entity_id: z.string().uuid(),
                entity_type: z.enum(['ticket', 'project'])
            }),
            { asset_id, entity_id, entity_type }
        );
        
        await AssetAssociationModel.delete(asset_id, entity_id, entity_type);
        
        // Revalidate relevant paths
        revalidatePath('/assets');
        if (entity_type === 'ticket') {
            revalidatePath(`/tickets/${entity_id}`);
        }
    } catch (error) {
        console.error('Error removing asset association:', error);
        throw new Error('Failed to remove asset association');
    }
}
