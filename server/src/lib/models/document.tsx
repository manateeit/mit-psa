import logger from '../../utils/logger';
import { IDocument } from '../../interfaces';
import { createTenantKnex } from '@/lib/db';

const Document = {
    getAll: async (): Promise<IDocument[]> => {
        try {
            const {knex: db} = await createTenantKnex();
            const documents = await db<IDocument>('documents').select('*');
            return documents;
        } catch (error) {
            logger.error('Error getting all documents:', error);
            throw error;
        }
    },

    get: async (document_id: string): Promise<IDocument | undefined> => {
        try {
            const {knex: db} = await createTenantKnex();
            const document = await db<IDocument>('documents').select('*').where({ document_id }).first();
            return document;
        } catch (error) {
            logger.error(`Error getting document with id ${document_id}:`, error);
            throw error;
        }
    },

    insert: async (document: IDocument): Promise<Pick<IDocument, "document_id">> => {
        try {
            const {knex: db} = await createTenantKnex();
            const [document_id] = await db<IDocument>('documents').insert(document).returning('document_id');
            return document_id;
        } catch (error) {
            logger.error('Error inserting document:', error);
            throw error;
        }
    },

    update: async (document_id: string, document: Partial<IDocument>): Promise<void> => {
        try {
            const {knex: db} = await createTenantKnex();
            await db<IDocument>('documents').where({ document_id }).update(document);
        } catch (error) {
            logger.error(`Error updating document with id ${document_id}:`, error);
            throw error;
        }
    },

    delete: async (document_id: string): Promise<void> => {
        try {
            const {knex: db} = await createTenantKnex();
            await db<IDocument>('documents').where({ document_id }).del();
        } catch (error) {
            logger.error(`Error deleting document with id ${document_id}:`, error);
            throw error;
        }
    },

    getByTicketId: async (ticket_id: string): Promise<IDocument[]> => {
        try {
            const {knex: db} = await createTenantKnex();
            const documents = await db<IDocument>('documents').select('*').where({ ticket_id });
            return documents;
        } catch (error) {
            logger.error(`Error getting documents with ticket_id ${ticket_id}:`, error);
            throw error;
        }
    },

    getByCompanyId: async (company_id: string): Promise<IDocument[]> => {
        try {
            const {knex: db} = await createTenantKnex();
            const documents = await db<IDocument>('documents').select('*').where({ company_id });
            return documents;
        } catch (error) {
            logger.error(`Error getting documents with company_id ${company_id}:`, error);
            throw error;
        }
    },

    getByContactNameId: async (contact_name_id: string): Promise<IDocument[]> => {
        try {
            const {knex: db} = await createTenantKnex();
            const documents = await db<IDocument>('documents').select('*').where({ contact_name_id });
            return documents;
        } catch (error) {
            logger.error(`Error getting documents with contact_name_id ${contact_name_id}:`, error);
            throw error;
        }
    },
};

export default Document;
