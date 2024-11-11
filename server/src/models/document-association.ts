import { createTenantKnex } from '../lib/db';
import { IDocumentAssociation, IDocumentAssociationInput } from '../interfaces/document-association.interface';
import { v4 as uuidv4 } from 'uuid';

class DocumentAssociation {
    /**
     * Create a new document association
     */
    static async create(data: IDocumentAssociationInput): Promise<Pick<IDocumentAssociation, "association_id">> {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        const association: IDocumentAssociation = {
            ...data,
            association_id: uuidv4(),
            tenant,
            entered_at: new Date(),
            updated_at: new Date()
        };

        await knex('document_associations').insert(association);

        return { association_id: association.association_id };
    }

    /**
     * Delete document associations by document ID
     */
    static async deleteByDocument(document_id: string): Promise<void> {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        await knex('document_associations')
            .where({ document_id, tenant })
            .delete();
    }

    /**
     * Delete document associations by entity
     */
    static async deleteByEntity(entity_id: string, entity_type: string): Promise<void> {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        await knex('document_associations')
            .where({ entity_id, entity_type, tenant })
            .delete();
    }

    /**
     * Get document associations by entity
     */
    static async getByEntity(entity_id: string, entity_type: string): Promise<IDocumentAssociation[]> {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        return knex('document_associations')
            .where({ entity_id, entity_type, tenant })
            .orderBy('entered_at', 'desc');
    }

    /**
     * Check if a document is associated with an entity
     */
    static async isAssociated(document_id: string, entity_id: string, entity_type: string): Promise<boolean> {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        const result = await knex('document_associations')
            .where({ document_id, entity_id, entity_type, tenant })
            .first();

        return !!result;
    }
}

export default DocumentAssociation;
