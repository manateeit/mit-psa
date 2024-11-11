import logger from '../../utils/logger';
import { IDocumentAssociation, IDocumentAssociationInput } from '../../interfaces/document-association.interface';
import { createTenantKnex } from '../db';

const DocumentAssociation = {
    create: async (association: IDocumentAssociationInput): Promise<Pick<IDocumentAssociation, "association_id">> => {
        try {
            const {knex: db} = await createTenantKnex();
            const [result] = await db<IDocumentAssociation>('document_associations')
                .insert(association)
                .returning('association_id');
            return result;
        } catch (error) {
            logger.error('Error creating document association:', error);
            throw error;
        }
    },

    getByDocumentId: async (document_id: string): Promise<IDocumentAssociation[]> => {
        try {
            const {knex: db} = await createTenantKnex();
            const associations = await db<IDocumentAssociation>('document_associations')
                .select('*')
                .where('document_id', document_id);
            return associations;
        } catch (error) {
            logger.error(`Error getting associations for document ${document_id}:`, error);
            throw error;
        }
    },

    getByEntity: async (entity_id: string, entity_type: string): Promise<IDocumentAssociation[]> => {
        try {
            const {knex: db} = await createTenantKnex();
            const associations = await db<IDocumentAssociation>('document_associations')
                .select('*')
                .where('entity_id', entity_id)
                .andWhere('entity_type', entity_type);
            return associations;
        } catch (error) {
            logger.error(`Error getting associations for entity ${entity_id}:`, error);
            throw error;
        }
    },

    delete: async (association_id: string): Promise<void> => {
        try {
            const {knex: db} = await createTenantKnex();
            await db<IDocumentAssociation>('document_associations')
                .where('association_id', association_id)
                .delete();
        } catch (error) {
            logger.error(`Error deleting association ${association_id}:`, error);
            throw error;
        }
    },

    deleteByEntity: async (entity_id: string, entity_type: string): Promise<void> => {
        try {
            const {knex: db} = await createTenantKnex();
            await db<IDocumentAssociation>('document_associations')
                .where('entity_id', entity_id)
                .andWhere('entity_type', entity_type)
                .delete();
        } catch (error) {
            logger.error(`Error deleting associations for entity ${entity_id}:`, error);
            throw error;
        }
    },

    deleteByDocument: async (document_id: string): Promise<void> => {
        try {
            const {knex: db} = await createTenantKnex();
            await db<IDocumentAssociation>('document_associations')
                .where('document_id', document_id)
                .delete();
        } catch (error) {
            logger.error(`Error deleting associations for document ${document_id}:`, error);
            throw error;
        }
    }
};

export default DocumentAssociation;
