dotenv.config();

import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
import { finalizeInvoice, generateInvoice } from '@/lib/actions/invoiceActions';
import { v4 as uuidv4 } from 'uuid';
import knex from 'knex';
import { parse, addDays, parseISO } from 'date-fns';
import { TextEncoder } from 'util';
import dotenv from 'dotenv';
import { ICompanyTaxSettings } from '@/interfaces/tax.interfaces';
import exp from 'constants';

global.TextEncoder = TextEncoder;

let db: knex.Knex;
let companyId: string;

function randomUUID() {
  return uuidv4();
}

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(() => Promise.resolve({
    user: {
      id: 'mock-user-id',
    },
  })),
}));

vi.mock("@/app/api/auth/[...nextauth]/options", () => ({
  options: {},
}));

// const result = dotenv.config({
//   path: '.env.localtest'
// });

// if (result.parsed?.DB_NAME_SERVER) {
//   process.env.DB_NAME_SERVER = result.parsed.DB_NAME_SERVER;
// }

// Ensure we're using a test database
if (process.env.DB_NAME_SERVER === 'server') {
  throw new Error('Please use a test database for testing.');
}

beforeAll(async () => {
  dotenv.config();
  db = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER_SERVER,
      password: process.env.DB_PASSWORD_SERVER,
      database: process.env.DB_NAME_SERVER
    },
    migrations: {
      directory: "./migrations"
    },
    seeds: {
      directory: "./seeds/dev"
    }
  });

  // Drop all tables
  await db.raw('DROP SCHEMA public CASCADE');
  await db.raw('CREATE SCHEMA public');

  // Ensure the database is set up correctly
  await db.raw(`SET app.environment = '${process.env.APP_ENV}'`);

  await db.migrate.latest();
  await db.seed.run();
});

afterAll(async () => {
  // await db.destroy();
});

describe('Billing Invoice Generation', () => {
  let tenantId: string;
  let companyId: string;
  let planId: string;
  let categoryId: string;
  let service1Id: string;
  let service2Id: string;
  let taxRateId: string;

  beforeEach(async () => {
    // Create test data for each test
    ({ tenant: tenantId } = await db('tenants').select("tenant").first());

    companyId = uuidv4(); // Create a new company for each test
    await db('companies').insert({
      company_id: companyId,
      company_name: 'Test Company',
      tenant: tenantId,
    });

    planId = uuidv4();
    await db('billing_plans').insert({
      plan_id: planId,
      plan_name: 'Test Plan',
      billing_frequency: 'monthly',
      is_custom: false,
      plan_type: 'Fixed',
      tenant: tenantId,
    });

    categoryId = uuidv4();
    await db('service_categories').insert({
      tenant: tenantId,
      category_id: categoryId,
      category_name: 'Test Category',
      description: 'Test Category Description',
    });

    service1Id = uuidv4();
    service2Id = uuidv4();
    await db('service_catalog').insert([
      {
        tenant: tenantId,
        service_id: service1Id,
        service_name: 'Service 1',
        description: 'Test Service 1',
        service_type: 'Fixed',
        default_rate: 10000,
        unit_of_measure: 'unit',
        category_id: categoryId,
      },
      {
        tenant: tenantId,
        service_id: service2Id,
        service_name: 'Service 2',
        description: 'Test Service 2',
        service_type: 'Fixed',
        default_rate: 15000,
        unit_of_measure: 'unit',
        category_id: categoryId,
      },
    ]);

    await db('plan_services').insert([
      {
        plan_id: planId,
        service_id: service1Id,
        quantity: 1,
        tenant: tenantId,
      },
      {
        plan_id: planId,
        service_id: service2Id,
        quantity: 1,
      },
    ]);

    await db('company_billing_plans').insert({
      company_billing_plan_id: uuidv4(),
      company_id: companyId,
      plan_id: planId,
      start_date: new Date('2023-01-01'),
      is_active: true,
    });

    await db('company_billing_cycles').insert({
      company_id: companyId,
      billing_cycle: 'monthly',
    });

    taxRateId = uuidv4();
    await db('tax_rates').insert({
      tax_rate_id: taxRateId,
      tax_type: 'VAT',
      country_code: 'US',
      tax_percentage: 10,
      is_reverse_charge_applicable: false,
      is_composite: false,
      start_date: new Date('2023-01-01'),
      is_active: true,
      description: 'Standard VAT',
    });

    const companyTaxSettings: ICompanyTaxSettings = {
      company_id: companyId,
      tax_rate_id: taxRateId,
      is_reverse_charge_applicable: false,
    };
    await db('company_tax_settings').insert(companyTaxSettings);

  });

  // afterEach(async () => {
  //   // set up drops the db
  // });

  describe('generateInvoice', () => {
    // You might want to add a new test case to verify tax calculation
    it('should calculate taxes correctly', async () => {
      const startDate = '2023-01-01T00:00:00Z';
      const endDate = '2023-02-01T00:00:00Z';

      const result = await generateInvoice(companyId, startDate, endDate);

      // Assuming the total before tax is 25000 (from your existing test)
      const expectedTaxAmount = 2500; // 10% of 25000
      const expectedTotal = 27500; // 25000 + 2500

      expect(result.tax).toEqual(expectedTaxAmount);
      expect(result.total).toEqual(expectedTotal);
    });

    it('should create a new invoice for a given tenant and company', async () => {
      const startDate = '2023-01-01T00:00:00Z';
      const endDate = '2023-02-01T00:00:00Z';

      console.log(startDate, endDate);

      try {
        const result = await generateInvoice(companyId, startDate, endDate);

        result.total = parseFloat(result.total.toString());

        // Assert
        expect(result).toMatchObject({
          company: {
            name: 'Test Company',
            logo: '',
            address: '',
          },
          subtotal: expect.closeTo(25000, 0.01),
          status: 'draft',
        });

        expect(result.invoice_date).toBeInstanceOf(Date);
        expect(result.due_date).toBeInstanceOf(Date);

        // Check that invoice items were created correctly
        const invoiceItems = await db('invoice_items')
          .where('invoice_id', result.invoice_id)
          .select('*');

        expect(invoiceItems).toHaveLength(2);
        expect(invoiceItems).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              description: expect.stringContaining('Service 1'),
              quantity: expect.any(Number),
              unit_price: expect.any(Number),
              total_price: expect.any(Number),
            }),
            expect.objectContaining({
              description: expect.stringContaining('Service 2'),
              quantity: expect.any(Number),
              unit_price: expect.any(Number),
              total_price: expect.any(Number),
            })
          ])
        );
        

        // Check that due date is calculated correctly
        const expectedDueDate = addDays(new Date(endDate), 30);
        expect(result.due_date).toEqual(expectedDueDate);
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
  });


  it('should process all active billing plans for the company', async () => {
    // Arrange
    const startDate = '2023-01-01T00:00:00Z';
    const endDate = '2023-02-01T00:00:00Z';

    // Use existing tenant and company data
    const tenant = await db('tenants').where('tenant', tenantId).first();
    if (!tenant) {
      throw new Error('No tenant found in the database');
    }

    // Use existing category
    const category = await db('service_categories').where('tenant', tenantId).first();
    if (!category) {
      throw new Error('No service category found');
    }

    // Create an additional service
    const service3Id = uuidv4();
    await db('service_catalog').insert({
      tenant: tenantId,
      service_id: service3Id,
      service_name: 'Service 3',
      description: 'Test Service 3',
      service_type: 'Fixed',
      default_rate: 30000,
      unit_of_measure: 'unit',
      category_id: category.category_id,
    });

    // Add the new service to the existing plan
    await db('plan_services').insert({
      plan_id: planId,
      service_id: service3Id,
      quantity: 1,
      tenant: tenantId,
    });
    const { user_id } = await db('users').where({ tenant: tenantId }).select('user_id').first() || {};
    if (!user_id) {
      throw new Error('No users found');
    }

    // Create time entries for each service
    const serviceIds = [service1Id, service2Id, service3Id];
    for (let i = 0; i < serviceIds.length; i++) {
      await db('time_entries').insert({
        tenant: tenantId,
        entry_id: uuidv4(),
        start_time: '2023-01-15T09:00:00Z',
        end_time: '2023-01-15T14:00:00Z',
        notes: `Work on Service ${i + 1}`,
        billable_duration: 300, // 5 hours in minutes
        work_item_type: 'service',
        approval_status: 'APPROVED',
        service_id: serviceIds[i],
        user_id: user_id
      });
    }

    // Act
    const result = await generateInvoice(companyId, startDate, endDate);

    // Assert
    expect(result).toMatchObject({
      company: { name: 'Test Company' },
      subtotal: 55000, // (1 * 10000) + (1 * 15000) + (1 * 30000)
      status: 'draft'
    });

    expect(result.invoice_date).toBeInstanceOf(Date);
    expect(result.due_date).toBeInstanceOf(Date); 

    // Check that invoice items were created correctly
    const invoiceItems = await db('invoice_items')
      .where('invoice_id', result.invoice_id)
      .select('*');

    expect(invoiceItems).toHaveLength(3);
    expect(invoiceItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ description: 'Service 1', quantity: 1, unit_price: 10000, net_amount: 10000 }),
      expect.objectContaining({ description: 'Service 2', quantity: 1, unit_price: 15000, net_amount: 15000 }),
      expect.objectContaining({ description: 'Service 3', quantity: 1, unit_price: 30000, net_amount: 30000 }),
    ]));
  });


  it('should handle time-based plans correctly', async () => {
    // let's set up a plan that provides discounts for hourly consulting services
    // the plan rate is stored in the plan_services table
    // the lower rate is applied to the invoice


    // Set up a time-based plan
    const planId = uuidv4();
    await db('billing_plans').insert({
      plan_id: planId,
      plan_name: 'Time-Based Plan',
      billing_frequency: 'monthly',
      is_custom: false,
      plan_type: 'Hourly',
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create a time-based service
    const serviceId = uuidv4();
    await db('service_catalog').insert({
      tenant: '11111111-1111-1111-1111-111111111111',
      service_id: serviceId,
      service_name: 'Hourly Consultation',
      description: 'Hourly rate for consultation',
      service_type: 'Hourly',
      default_rate: 10000,
      unit_of_measure: 'hour',
      //category_id: categoryId,
    });

    // clear out the other plan entries
    await db('plan_services').where({ tenant: '11111111-1111-1111-1111-111111111111' }).del();

    // Link the service to the plan
    await db('plan_services').insert({
      plan_id: planId,
      service_id: serviceId,
      tenant: '11111111-1111-1111-1111-111111111111',
      custom_rate: 5000,
    });

    // Assign the plan to the company
    await db('company_billing_plans').insert({
      company_billing_plan_id: uuidv4(),
      company_id: companyId,
      plan_id: planId,
      start_date: new Date('2023-01-01'),
      is_active: true,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create a ticket for the time entry
    const ticketId = uuidv4();
    await db('tickets').insert({
      tenant: '11111111-1111-1111-1111-111111111111',
      ticket_id: ticketId,
      title: 'Automatically generated ticket for time entry',
      company_id: companyId,
      status_id: (await db('statuses').where({ tenant: '11111111-1111-1111-1111-111111111111', status_type: 'ticket' }).first())?.status_id,
      entered_by: (await db('users').where({ tenant: '11111111-1111-1111-1111-111111111111' }).select('user_id').first())?.user_id,
      entered_at: new Date(),
      updated_at: new Date()
    });

    // Create a time entry
    await db('time_entries').insert({
      tenant: '11111111-1111-1111-1111-111111111111',
      entry_id: uuidv4(),
      user_id: (await db('users').select('user_id').first())['user_id'] as string,
      start_time: new Date('2023-01-15T10:00:00Z'),
      end_time: new Date('2023-01-15T12:00:00Z'),
      work_item_id: ticketId,
      work_item_type: 'ticket',
      approval_status: 'APPROVED',
      service_id: serviceId,
      billable_duration: 120, // 2 hours
    });

    // Generate the invoice
    const startDate = '2023-01-01T00:00:00Z';
    const endDate = '2023-01-31T00:00:00Z';
    const result = await generateInvoice(companyId, startDate, endDate);

    result.total = parseFloat(result.total.toString());

    // Assert
    expect(result).toMatchObject({
      company: {
        name: 'Test Company',
        logo: '',
        address: '',
      },
      subtotal: 10000, // 2 hours * $50/hour
      status: 'draft',
    });

    expect(result.invoice_date).toBeInstanceOf(Date);
    expect(result.due_date).toBeInstanceOf(Date);

    // Check that invoice items were created correctly
    const invoiceItems = await db('invoice_items')
      .where('invoice_id', result.invoice_id)
      .select('*');

    expect(invoiceItems).toHaveLength(1);
    expect(invoiceItems[0]).toMatchObject({
      description: 'Hourly Consultation',
      quantity: 2,
      unit_price: 5000,
      net_amount: 10000
    });
  });

  it('should handle usage-based plans correctly', async () => {
    // Arrange
    const startDate = '2023-01-01T00:00:00Z';
    const endDate = '2023-01-31T23:59:59Z';

    // Create a usage-based plan
    const planId = uuidv4();
    await db('billing_plans').insert({
      plan_id: planId,
      plan_name: 'Wonderland Data Usage',
      billing_frequency: 'monthly',
      is_custom: false,
      plan_type: 'Usage',
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create a usage-based service
    const serviceId = uuidv4();
    await db('service_catalog').insert({
      tenant: '11111111-1111-1111-1111-111111111111',
      service_id: serviceId,
      service_name: 'Looking Glass Data Transfer',
      description: 'Data transfer through the looking glass',
      service_type: 'Usage',
      default_rate: 10, // 10 cents per GB
      unit_of_measure: 'GB',
    });

    // remove other company billing plans and services
    await db('company_billing_plans').where({ company_id: companyId }).delete();
    await db('plan_services').where({ plan_id: planId }).delete();

    // Link the service to the plan
    await db('plan_services').insert({
      plan_id: planId,
      service_id: serviceId,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Assign the plan to the company
    await db('company_billing_plans').insert({
      company_billing_plan_id: uuidv4(),
      company_id: companyId,
      plan_id: planId,
      start_date: parseISO('2023-01-01T00:00:00Z'),
      is_active: true,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create usage records
    await db('usage_tracking').insert([
      {
        tenant: '11111111-1111-1111-1111-111111111111',
        usage_id: uuidv4(),
        company_id: companyId,
        service_id: serviceId,
        usage_date: '2023-01-15',
        quantity: 50, // 50 GB
      },
      {
        tenant: '11111111-1111-1111-1111-111111111111',
        usage_id: uuidv4(),
        company_id: companyId,
        service_id: serviceId,
        usage_date: '2023-01-20',
        quantity: 30, // 30 GB
      },
    ]);

    // Act
    const result = await generateInvoice(companyId, startDate, endDate);

    // Assert
    expect(result).toMatchObject({
      company: { name: 'Test Company' },
      subtotal: 800, // (50 + 30) * 10 cents = $8.00
      status: 'draft'
    });

    expect(result.invoice_date).toBeInstanceOf(Date);
    expect(result.due_date).toBeInstanceOf(Date);

    // Check that invoice items were created correctly
    const invoiceItems = await db('invoice_items')
      .where('invoice_id', result.invoice_id)
      .select('*');

    // QUESTION RBI : Should we have 2 items or 1 item with a quantity of 80?
    expect(invoiceItems).toHaveLength(2);
    expect(invoiceItems[0]).toMatchObject({
      description: 'Looking Glass Data Transfer',
      quantity: 50, // Total usage: 50 + 30 GB
      unit_price: 10, // 10 cents in cents
      net_amount: 500, // 80 * 10 cents
    });
    expect(invoiceItems[1]).toMatchObject({
      description: 'Looking Glass Data Transfer',
      quantity: 30, // Total usage: 50 + 30 GB
      unit_price: 10, // 10 cents in cents
      net_amount: 300, // 80 * 10 cents
    });
  });

  it('should handle bucket plans correctly', async () => {
    // Arrange                                                                                                                                                                                                                                                                                                                                                            
    const startDate = '2023-01-01T00:00:00Z';
    const endDate = '2023-02-01T00:00:00Z';

    // Create a bucket plan                                                                                                                                                                                                                                                                                                                                               
    const planId = uuidv4();
    await db('billing_plans').insert({
      plan_id: planId,
      plan_name: 'Emerald City Hours',
      billing_frequency: 'monthly',
      is_custom: false,
      plan_type: 'Bucket',
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create a service catalog entry for the bucket plan                                                                                                                                                                                                                                                                                                                 
    const serviceCatalogId = uuidv4();
    await db('service_catalog').insert({
      service_id: serviceCatalogId,
      service_name: 'Emerald City Consulting Hours',
      description: 'Consulting hours for Emerald City projects',
      service_type: 'Bucket',
      default_rate: 0, // The rate is handled by the bucket plan                                                                                                                                                                                                                                                                                                          
      unit_of_measure: 'hour',
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create a bucket plan service                                                                                                                                                                                                                                                                                                                                       
    const bucketPlanId = uuidv4();
    await db('bucket_plans').insert({
      bucket_plan_id: bucketPlanId,
      plan_id: planId,
      total_hours: 40,
      billing_period: 'Monthly',
      overage_rate: 7500, // $75 per hour in cents                                                                                                                                                                                                                                                                                                                        
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // remove other company billing plans and services
    await db('company_billing_plans').where({ company_id: companyId }).delete();
    await db('plan_services').where({ plan_id: planId }).delete();

    // Assign the plan to the company                                                                                                                                                                                                                                                                                                                                     
    await db('company_billing_plans').insert({
      company_billing_plan_id: uuidv4(),
      company_id: companyId,
      plan_id: planId,
      start_date: new Date('2023-01-01'),
      is_active: true,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create bucket usage                                                                                                                                                                                                                                                                                                                                                
    await db('bucket_usage').insert({
      usage_id: uuidv4(),
      bucket_plan_id: bucketPlanId,
      company_id: companyId,
      period_start: '2023-01-01',
      period_end: '2023-01-31',
      hours_used: 45,
      overage_hours: 5,
      service_catalog_id: serviceCatalogId,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Act                                                                                                                                                                                                                                                                                                                                                                
    const result = await generateInvoice(companyId, startDate, endDate);

    // Assert                                                                                                                                                                                                                                                                                                                                                             
    expect(result).toMatchObject({
      company: { name: 'Test Company' },
      subtotal: 37500, // 5 overage hours * $75 per hour = $375.00                                                                                                                                                                                                                                                                                                           
      status: 'draft'
    });

    expect(result.invoice_date).toBeInstanceOf(Date);
    expect(result.due_date).toBeInstanceOf(Date);

    // Check that invoice items were created correctly                                                                                                                                                                                                                                                                                                                    
    const invoiceItems = await db('invoice_items')
      .where('invoice_id', result.invoice_id)
      .select('*');

    expect(invoiceItems).toHaveLength(1);
    expect(invoiceItems[0]).toMatchObject({
      description: 'Emerald City Consulting Hours (Overage)',
      quantity: 5,
      unit_price: 7500,
      net_amount: 37500
    });
  });

  it('should apply discounts to the invoice', async () => {
    // Arrange
    const startDate = '2023-01-01T00:00:00Z';
    const endDate = '2023-02-01T00:00:00Z';

    // remove other company billing plans and services
    await db('company_billing_plans').where({ company_id: companyId }).delete();
    await db('plan_services').where({ tenant: tenantId }).delete();

    // Create a fixed-price plan
    const planId = uuidv4();
    await db('billing_plans').insert({
      plan_id: planId,
      plan_name: 'Wonderland Tea Party Package',
      billing_frequency: 'monthly',
      is_custom: false,
      plan_type: 'Fixed',
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create a service
    const serviceId = uuidv4();
    await db('service_catalog').insert({
      tenant: '11111111-1111-1111-1111-111111111111',
      service_id: serviceId,
      service_name: 'Mad Hatter Tea Service',
      description: 'Endless tea and cakes',
      service_type: 'Fixed',
      default_rate: 10000, // $100 in cents
      unit_of_measure: 'month',
    });

    // Link the service to the plan
    await db('plan_services').insert({
      plan_id: planId,
      service_id: serviceId,
      quantity: 1,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Assign the plan to the company
    await db('company_billing_plans').insert({
      company_billing_plan_id: uuidv4(),
      company_id: companyId,
      plan_id: planId,
      start_date: parseISO('2023-01-01T00:00:00Z'),
      is_active: true,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create a discount
    const discountId = uuidv4();
    await db('discounts').insert({
      discount_id: discountId,
      discount_name: 'Cheshire Cat Smile Discount',
      discount_type: 'percentage',
      value: 20, // 20% discount
      start_date: parseISO('2023-01-01T00:00:00Z'),
      end_date: parseISO('2023-02-01T00:00:00Z'),
      is_active: true,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Apply the discount to the company's plan
    await db('plan_discounts').insert({
      plan_id: planId,
      company_id: companyId,
      discount_id: discountId,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Act
    const result = await generateInvoice(companyId, startDate, endDate);

    // Assert
    expect(result).toMatchObject({
      company: { name: 'Test Company' },
      subtotal: 8000, // $100 before discount $80 after 20% discount
      status: 'draft'
    });

    expect(result.invoice_date).toBeInstanceOf(Date);
    expect(result.due_date).toBeInstanceOf(Date);

    // Check that invoice items and discounts were created correctly
    const invoiceItems = await db('invoice_items')
      .where('invoice_id', result.invoice_id)
      .select('*');

    expect(invoiceItems).toHaveLength(2);
    expect(invoiceItems).toEqual(expect.arrayContaining([
      expect.objectContaining({
        description: 'Mad Hatter Tea Service',
        quantity: 1,
        unit_price: 10000,
        net_amount: 10000,
      }),
      expect.objectContaining({
        description: 'Cheshire Cat Smile Discount',
        quantity: 1,
        net_amount: -2000,
        unit_price: -2000,
      }),
    ]));
  });

  it('should finalize the invoice', async () => {
    // Arrange
    const startDate = '2023-01-01T00:00:00Z';
    const endDate = '2023-02-01T00:00:00Z';

    // delete the previous plan services and company billing plans
    await db('plan_services').where({ tenant: '11111111-1111-1111-1111-111111111111' }).del();
    await db('company_billing_plans').where({ tenant: '11111111-1111-1111-1111-111111111111' }).del();

    // Create a fixed-price plan
    const planId = uuidv4();
    await db('billing_plans').insert({
      plan_id: planId,
      plan_name: 'Wonderland Adventure Package',
      billing_frequency: 'monthly',
      is_custom: false,
      plan_type: 'Fixed',
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create a service
    const serviceId = uuidv4();
    await db('service_catalog').insert({
      tenant: '11111111-1111-1111-1111-111111111111',
      service_id: serviceId,
      service_name: 'Rabbit Hole Expeditions',
      description: 'Guided tours through Wonderland',
      service_type: 'Fixed',
      default_rate: 20000, // $200 in cents
      unit_of_measure: 'month',
    });



    // Link the service to the plan
    await db('plan_services').insert({
      plan_id: planId,
      service_id: serviceId,
      tenant: '11111111-1111-1111-1111-111111111111',
      quantity: 1
    });

    // Assign the plan to the company
    await db('company_billing_plans').insert({
      company_billing_plan_id: uuidv4(),
      company_id: companyId,
      plan_id: planId,
      start_date: new Date('2023-01-01'),
      is_active: true,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Act
    const result = await generateInvoice(companyId, startDate, endDate);

    // Assert
    expect(result).toMatchObject({
      company: { name: 'Test Company' },
      subtotal: 20000, // $200
      status: 'draft'
    });

    expect(result.invoice_date).toBeInstanceOf(Date);
    expect(result.due_date).toBeInstanceOf(Date);

    // Finalize the invoice
    const finalizedInvoice = await finalizeInvoice(result.invoice_id);

    // Assert finalized invoice
    expect(finalizedInvoice).toMatchObject({
      invoice_id: result.invoice_id,
      status: 'sent',
      finalized_at: expect.any(Date),
    });

    // Check that a transaction record was created
    // const transaction = await db('transactions')
    //   .where({ invoice_id: result.invoice_id })
    //   .first();

    // expect(transaction).toMatchObject({
    //   company_id: companyId,
    //   invoice_id: result.invoice_id,
    //   transaction_type: 'invoice_finalized',
    //   amount: 20000,
    //   transaction_date: expect.any(Date),
    // });

    // // Check that an email notification was queued
    // const notification = await db('notifications')
    //   .where({
    //     company_id: companyId,
    //     notification_type: 'invoice_ready'
    //   })
    //   .first();

    // expect(notification).toMatchObject({
    //   company_id: companyId,
    //   notification_type: 'invoice_ready',
    //   status: 'queued',
    // });
  });

  it('should calculate taxes for the invoice', async () => {
    // Arrange
    const startDate = '2023-01-01T00:00:00Z';
    const endDate = '2023-02-01T00:00:00Z';

    // remove other company billing plans and services
    await db('company_billing_plans').where({ company_id: companyId }).delete();
    await db('plan_services').where({ tenant: tenantId }).delete();

    // Create a fixed-price plan
    const planId = uuidv4();
    await db('billing_plans').insert({
      plan_id: planId,
      plan_name: 'Yellow Brick Road Maintenance',
      billing_frequency: 'monthly',
      is_custom: false,
      plan_type: 'Fixed',
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create a service
    const serviceId = uuidv4();
    await db('service_catalog').insert({
      tenant: '11111111-1111-1111-1111-111111111111',
      service_id: serviceId,
      service_name: 'Emerald City Polishing',
      description: 'Keep the Emerald City shining',
      service_type: 'Fixed',
      default_rate: 50000, // $500 in cents        
      unit_of_measure: 'Month',
    });

    // Link the service to the plan
    await db('plan_services').insert({
      plan_id: planId,
      service_id: serviceId,
      quantity: 1,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Assign the plan to the company
    await db('company_billing_plans').insert({
      company_billing_plan_id: uuidv4(),
      company_id: companyId,
      plan_id: planId,
      start_date: parseISO('2023-01-01T00:00:00Z'),
      is_active: true,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Create a tax rate
    const taxRateId = uuidv4();
    await db('tax_rates').insert({
      tax_rate_id: taxRateId,
      region: 'Oz',
      tax_percentage: 8.5,
      description: 'Oz Sales Tax',
      start_date: '2023-01-01',
      end_date: null,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Assign the tax rate to the company
    await db('company_tax_rates').insert({
      company_id: companyId,
      tax_rate_id: taxRateId,
      tenant: '11111111-1111-1111-1111-111111111111',
    });

    // Act
    const result = await generateInvoice(companyId, startDate, endDate);

    // Assert
    expect(result).toMatchObject({
      company: { name: 'Test Company' },
      subtotal: 50000, // $500 before tax
      tax: 5000, // 10% of $500 = $50.00
      total: 55000, // $542.50 after tax
      status: 'draft'
    });

    expect(result.invoice_date).toBeInstanceOf(Date);
    expect(result.due_date).toBeInstanceOf(Date);

    // Check that invoice items and taxes were created correctly
    const invoiceItems = await db('invoice_items')
      .where('invoice_id', result.invoice_id)
      .select('*');

    expect(invoiceItems).toHaveLength(1);
    expect(invoiceItems).toEqual(expect.arrayContaining([
      expect.objectContaining({
        description: 'Emerald City Polishing',
        quantity: 1,
        unit_price: 50000,
        net_amount: 50000,
      }),
    ]));
  });

  it('should handle a billing period with no active plans', async () => {
    // Arrange
    const startDate = '2023-01-01T00:00:00Z';
    const endDate = '2023-02-01T00:00:00Z';

    const tenant = await db('tenants').first();
    if (!tenant) {
      throw new Error('No tenant found in the database');
    }

    const companyId = uuidv4();
    await db('companies').insert({
      company_id: companyId,
      company_name: 'Test Company Without Plans',
      tenant: tenantId,
    });

    const companyWithoutPlans = await db('companies').where('company_id', companyId).first();

    // Act
    await expect(generateInvoice(companyWithoutPlans.company_id, startDate, endDate))
      .rejects.toThrow(`No active billing plans found for company ${companyWithoutPlans.company_id} in the given period`);
  });

  it('should handle a billing period with no active plans', async () => {
    // Arrange
    const startDate = '2023-01-01T00:00:00Z';
    const endDate = '2023-02-01T00:00:00Z';

    const tenant = await db('tenants').first();
    if (!tenant) {
      throw new Error('No tenant found in the database');
    }

    const companyId = uuidv4();
    await db('companies').insert({
      company_id: companyId,
      company_name: 'Test Company Without Plans',
      tenant: tenantId,
    });

    const companyWithoutPlans = await db('companies').where('company_id', companyId).first();

    // Act & Assert
    await expect(generateInvoice(companyWithoutPlans.company_id, startDate, endDate))
      .rejects.toThrow(`No active billing plans found for company ${companyWithoutPlans.company_id} in the given period`);
  });

  it('should throw an error for invalid billing period dates', async () => {
    // Arrange
    const startDate = '2023-02-01T00:00:00Z';
    const endDate = '2023-01-01T00:00:00Z';

    // Act & Assert
    await expect(generateInvoice(companyId, startDate, endDate))
      .rejects.toThrow('Invalid billing period: start date must be before end date');
  });
});

it('identify and throw an error for services with undefined rates', async () => {
  // Arrange
  const startDate = '2023-01-01T00:00:00Z';
  const endDate = '2023-02-01T00:00:00Z';

  companyId = uuidv4(); // Create a new company for each test
  await db('companies').insert({
    company_id: companyId,
    company_name: 'Test Company',
    tenant: '11111111-1111-1111-1111-111111111111',
  });

  // Create a fixed-price plan
  const planId = uuidv4();
  await db('billing_plans').insert({
    plan_id: planId,
    plan_name: 'Yellow Brick Road Maintenance',
    billing_frequency: 'monthly',
    is_custom: false,
    plan_type: 'Fixed',
    tenant: '11111111-1111-1111-1111-111111111111',
  });

  // Create a service
  const serviceId = uuidv4();
  await db('service_catalog').insert({
    tenant: '11111111-1111-1111-1111-111111111111',
    service_id: serviceId,
    service_name: 'Emerald City Polishing',
    description: 'Keep the Emerald City shining',
    service_type: 'Fixed',
    default_rate: null, // $500 in cents        
    unit_of_measure: 'Month',
  });

  // Link the service to the plan
  await db('plan_services').insert({
    plan_id: planId,
    service_id: serviceId,
    tenant: '11111111-1111-1111-1111-111111111111',
  });

  // Assign the plan to the company
  await db('company_billing_plans').insert({
    company_billing_plan_id: uuidv4(),
    company_id: companyId,
    plan_id: planId,
    start_date: new Date('2023-01-01'),
    is_active: true,
    tenant: '11111111-1111-1111-1111-111111111111',
  });

  // Act
  await expect(generateInvoice(companyId, startDate, endDate))
    .rejects.toThrow();
});


describe('processFixedPlan', () => {
  it.todo('should create line items for all services in the plan');
  it.todo('should use custom rates when available');
  it.todo('should use default rates when custom rates are not set');
  it.todo('should calculate total correctly based on quantity and rate');
  it.todo('should handle plans with no services');
});

describe('processTimeBasedPlan', () => {
  it.todo('should create line items for all time entries in the billing period');
  it.todo('should calculate duration correctly');
  it.todo('should use the correct rate for each service');
  it.todo('should handle billing periods with no time entries');
});

describe('processUsageBasedPlan', () => {
  it.todo('should create line items for all usage records in the billing period');
  it.todo('should calculate quantity correctly');
  it.todo('should use the correct rate for each service');
  it.todo('should handle billing periods with no usage records');
});

describe('processBucketPlan', () => {
  it.todo('should create a line item for the base bucket hours');
  it.todo('should create a line item for overage hours when usage exceeds bucket');
  it.todo('should not create an overage line item when usage is within bucket');
  it.todo('should calculate overage hours correctly');
  it.todo('should use the correct base price and overage rate');
});

describe('getPlanRate', () => {
  it.todo('should return custom rate when available');
  it.todo('should return default rate when custom rate is not set');
  it.todo('should handle cases where neither custom nor default rate is set');
});

