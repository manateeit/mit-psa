import { TenantEntity } from ".";

export interface IDocumentAssociation extends TenantEntity {
    association_id: string;
    document_id: string;
    entity_id: string;
    entity_type: 'ticket' | 'company' | 'contact' | 'schedule';
    created_at?: Date;
}

export interface IDocumentAssociationInput {
    document_id: string;
    entity_id: string;
    entity_type: 'ticket' | 'company' | 'contact' | 'schedule';
    tenant: string;
}
