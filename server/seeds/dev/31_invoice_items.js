exports.seed = function (knex) {
    return knex('invoice_items').del()
        .then(() => {
            return knex('invoice_items').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    invoice_id: knex('invoices').where({ tenant: '11111111-1111-1111-1111-111111111111', invoice_number: 'INV-003' }).select('invoice_id').first(),
                    service_id: knex('service_catalog').where({ tenant: '11111111-1111-1111-1111-111111111111', service_name: 'Rabbit Tracking' }).select('service_id').first(),
                    description: 'Advanced Rabbit Tracking Services',
                    quantity: 40,
                    unit_price: 100.00,
                    total_price: 4000.00
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    invoice_id: knex('invoices').where({ tenant: '11111111-1111-1111-1111-111111111111', invoice_number: 'INV-003' }).select('invoice_id').first(),
                    service_id: knex('service_catalog').where({ tenant: '11111111-1111-1111-1111-111111111111', service_name: 'Looking Glass Maintenance' }).select('service_id').first(),
                    description: 'Emergency Looking Glass Repair',
                    quantity: 1,
                    unit_price: 1000.00,
                    total_price: 1000.00
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    invoice_id: knex('invoices').where({ tenant: '11111111-1111-1111-1111-111111111111', invoice_number: 'INV-004' }).select('invoice_id').first(),
                    service_id: knex('service_catalog').where({ tenant: '11111111-1111-1111-1111-111111111111', service_name: 'Yellow Brick Road Repair' }).select('service_id').first(),
                    description: 'Major Yellow Brick Road Overhaul',
                    quantity: 1,
                    unit_price: 10000.00,
                    total_price: 10000.00
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    invoice_id: knex('invoices').where({ tenant: '11111111-1111-1111-1111-111111111111', invoice_number: 'INV-004' }).select('invoice_id').first(),
                    service_id: knex('service_catalog').where({ tenant: '11111111-1111-1111-1111-111111111111', service_name: 'Emerald City Security' }).select('service_id').first(),
                    description: 'Enhanced Security Package',
                    quantity: 1,
                    unit_price: 2000.00,
                    total_price: 2000.00
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    invoice_id: knex('invoices').where({ tenant: '11111111-1111-1111-1111-111111111111', invoice_number: 'INV-005' }).select('invoice_id').first(),
                    service_id: knex('service_catalog').where({ tenant: '11111111-1111-1111-1111-111111111111', service_name: 'Rabbit Tracking' }).select('service_id').first(),
                    description: 'Premium Rabbit Tracking Services',
                    quantity: 50,
                    unit_price: 125.00,
                    total_price: 6250.00
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    invoice_id: knex('invoices').where({ tenant: '11111111-1111-1111-1111-111111111111', invoice_number: 'INV-005' }).select('invoice_id').first(),
                    service_id: knex('service_catalog').where({ tenant: '11111111-1111-1111-1111-111111111111', service_name: 'Looking Glass Maintenance' }).select('service_id').first(),
                    description: 'Monthly Looking Glass Maintenance',
                    quantity: 1,
                    unit_price: 1250.00,
                    total_price: 1250.00
                }
            ]);
        });
};