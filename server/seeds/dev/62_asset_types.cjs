exports.seed = async function(knex) {
    // First delete dependent tables
    await knex('asset_maintenance_history').del();
    await knex('asset_maintenance_notifications').del();
    await knex('asset_maintenance_schedules').del();
    await knex('asset_document_associations').del();
    await knex('asset_ticket_associations').del();
    await knex('asset_service_history').del();
    await knex('assets').del();
    await knex('asset_types').del();

    const tenant = await knex('tenants').select('tenant').first();
    const now = new Date().toISOString();
    
    if (tenant) {
        // First create parent types
        await knex('asset_types').insert([
            {
                tenant: tenant.tenant,
                type_id: '11111111-1111-1111-1111-111111111111',
                type_name: 'Hardware',
                attributes_schema: {
                    manufacturer: { type: 'string', required: true },
                    model: { type: 'string', required: true },
                    power_consumption: { type: 'number', unit: 'watts' }
                },
                created_at: now,
                updated_at: now
            },
            {
                tenant: tenant.tenant,
                type_id: '22222222-2222-2222-2222-222222222222',
                type_name: 'Software',
                attributes_schema: {
                    version: { type: 'string', required: true },
                    license_type: { type: 'string', enum: ['perpetual', 'subscription'] },
                    seats: { type: 'number' }
                },
                created_at: now,
                updated_at: now
            },
            {
                tenant: tenant.tenant,
                type_id: '33333333-3333-3333-3333-333333333333',
                type_name: 'Network',
                attributes_schema: {
                    ip_address: { type: 'string' },
                    mac_address: { type: 'string' },
                    subnet_mask: { type: 'string' }
                },
                created_at: now,
                updated_at: now
            }
        ]);

        // Then create child types with parent references
        await knex('asset_types').insert([
            {
                tenant: tenant.tenant,
                type_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                type_name: 'Server',
                parent_type_id: '11111111-1111-1111-1111-111111111111',
                attributes_schema: {
                    cpu_cores: { type: 'number' },
                    ram_gb: { type: 'number' },
                    storage_tb: { type: 'number' }
                },
                created_at: now,
                updated_at: now
            },
            {
                tenant: tenant.tenant,
                type_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                type_name: 'Workstation',
                parent_type_id: '11111111-1111-1111-1111-111111111111',
                attributes_schema: {
                    cpu_model: { type: 'string' },
                    ram_gb: { type: 'number' },
                    gpu: { type: 'string' }
                },
                created_at: now,
                updated_at: now
            },
            {
                tenant: tenant.tenant,
                type_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
                type_name: 'Network Switch',
                parent_type_id: '33333333-3333-3333-3333-333333333333',
                attributes_schema: {
                    ports: { type: 'number' },
                    speed_gbps: { type: 'number' },
                    managed: { type: 'boolean' }
                },
                created_at: now,
                updated_at: now
            },
            {
                tenant: tenant.tenant,
                type_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
                type_name: 'Operating System',
                parent_type_id: '22222222-2222-2222-2222-222222222222',
                attributes_schema: {
                    edition: { type: 'string' },
                    architecture: { type: 'string', enum: ['32-bit', '64-bit'] }
                },
                created_at: now,
                updated_at: now
            }
        ]);
    }
};
