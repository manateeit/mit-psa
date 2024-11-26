'use server'

import { createTenantKnex } from '@/lib/db';
import CompanyBillingPlan from '@/lib/models/clientBilling';
import { IInvoice } from '@/interfaces/invoice.interfaces';
import { ITransaction } from '@/interfaces/billing.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { generateInvoiceNumber } from './invoiceActions';

export async function createPrepaymentInvoice(
    companyId: string,
    amount: number
): Promise<IInvoice> {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) {
        throw new Error('No tenant found');
    }

    if (!companyId) {
        throw new Error('Company ID is required');
    }

    
    // Create prepayment invoice
    return await knex.transaction(async (trx) => {
        // Create the prepayment invoice
        const [createdInvoice] = await trx('invoices')
            .insert({
                company_id: companyId,
                tenant,
                invoice_date: new Date().toISOString(),
                due_date: new Date().toISOString(), // Due immediately
                subtotal: amount,
                tax: 0, // Prepayments typically don't have tax
                total_amount: amount,
                status: 'draft',
                invoice_number: await generateInvoiceNumber(),
                billing_period_start: new Date().toISOString(),
                billing_period_end: new Date().toISOString(),
                credit_applied: 0
            })
            .returning('*');

        // Create credit issuance transaction
        await trx('transactions').insert({
            transaction_id: uuidv4(),
            company_id: companyId,
            invoice_id: createdInvoice.invoice_id,
            amount: amount,
            type: 'credit_issuance',
            status: 'completed',
            description: 'Credit issued from prepayment',
            created_at: new Date().toISOString(),
            tenant
        });

        // Update company credit balance
        await trx('companies')
            .where({ company_id: companyId, tenant })
            .increment('credit_balance', amount)
            .update('updated_at', new Date().toISOString());

        return createdInvoice;
    });
}

export async function applyCreditToInvoice(
    companyId: string,
    invoiceId: string,
    amount: number
): Promise<void> {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) throw new Error('No tenant found');
    
    await knex.transaction(async (trx) => {
        // Create the main credit application transaction
        const [creditTransaction] = await trx('transactions').insert({
            transaction_id: uuidv4(),
            company_id: companyId,
            invoice_id: invoiceId,
            amount: -amount,
            type: 'credit_application',
            status: 'completed',
            description: `Applied credit to invoice ${invoiceId}`,
            created_at: new Date().toISOString(),
            tenant
        }).returning('*');

        // Record credit balance adjustment
        await trx('transactions').insert({
            transaction_id: uuidv4(),
            company_id: companyId,
            amount: -amount,
            type: 'credit_adjustment',
            status: 'completed',
            description: 'Credit balance adjustment from application',
            parent_transaction_id: creditTransaction.transaction_id,
            created_at: new Date().toISOString(),
            tenant
        });

        // Create credit allocation record
        await trx('credit_allocations').insert({
            allocation_id: uuidv4(),
            transaction_id: creditTransaction.transaction_id,
            invoice_id: invoiceId,
            amount: amount,
            created_at: new Date().toISOString(),
            tenant
        });

        // Update invoice and company credit balance
        await Promise.all([
            trx('invoices')
                .where({ invoice_id: invoiceId })
                .increment('credit_applied', amount)
                .decrement('total_amount', amount),
            CompanyBillingPlan.updateCompanyCredit(companyId, -amount)
        ]);
    });
}

export async function getCreditHistory(
    companyId: string,
    startDate?: string,
    endDate?: string
): Promise<ITransaction[]> {
    const { knex } = await createTenantKnex();
    
    const query = knex('transactions')
        .where('company_id', companyId)
        .whereIn('type', ['credit', 'prepayment', 'credit_application', 'credit_refund'])
        .orderBy('created_at', 'desc');

    if (startDate) {
        query.where('created_at', '>=', startDate);
    }
    if (endDate) {
        query.where('created_at', '<=', endDate);
    }

    return query;
}

