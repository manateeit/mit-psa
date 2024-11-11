import { TenantEntity } from ".";

export interface IDocumentAssociation extends TenantEntity {
    association_id: string;
    document_id: string;
    entity_id: string;
    entity_type: 'ticket' | 'company' | 'contact' | 'schedule';
    entered_at?: Date;
    updated_at?: Date;
}

// Use this type alias instead of an empty interface
export type IDocumentAssociationInput = Omit<IDocumentAssociation, 'association_id' | 'entered_at' | 'updated_at'>;
