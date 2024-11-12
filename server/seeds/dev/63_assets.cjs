exports.seed = function(knex) {
    return knex('assets').del()
        .then(() => {
            return Promise.all([
                knex('tenants').select('tenant').first(),
                knex('companies').select('company_id', 'company_name')
            ]);
        })
        .then(([tenant, companies]) => {
            if (tenant) {
                const emeraldCity = companies.find(c => c.company_name === 'Emerald City');
                const wonderland = companies.find(c => c.company_name === 'Wonderland');
                const now = new Date().toISOString();

                // Create purchase and warranty dates
                const purchaseDate1 = new Date('2023-01-15').toISOString();
                const warrantyDate1 = new Date('2026-01-15').toISOString();
                const purchaseDate2 = new Date('2023-03-20').toISOString();
                const warrantyDate2 = new Date('2026-03-20').toISOString();
                const purchaseDate3 = new Date('2023-02-10').toISOString();
                const warrantyDate3 = new Date('2026-02-10').toISOString();
                const purchaseDate4 = new Date('2023-04-01').toISOString();
                const warrantyDate4 = new Date('2026-04-01').toISOString();
                const purchaseDate5 = new Date('2023-05-15').toISOString();
                const warrantyDate5 = new Date('2026-05-15').toISOString();
                const purchaseDate6 = new Date('2023-06-01').toISOString();
                const warrantyDate6 = new Date('2026-06-01').toISOString();

                return knex('assets').insert([
                    // Emerald City Assets
                    {
                        tenant: tenant.tenant,
                        type_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                        company_id: emeraldCity.company_id,
                        asset_tag: 'EC-SRV-001',
                        serial_number: 'RS789012',
                        name: 'Ruby Slippers Server',
                        status: 'active',
                        location: 'Main Data Center',
                        purchase_date: purchaseDate1,
                        warranty_end_date: warrantyDate1,
                        attributes: {
                            manufacturer: 'Oz Technologies',
                            model: 'RS-5000',
                            power_consumption: 750,
                            cpu_cores: 64,
                            ram_gb: 512,
                            storage_tb: 48
                        },
                        created_at: now,
                        updated_at: now
                    },
                    {
                        tenant: tenant.tenant,
                        type_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                        company_id: emeraldCity.company_id,
                        asset_tag: 'EC-WS-001',
                        serial_number: 'CB456789',
                        name: 'Crystal Ball Workstation',
                        status: 'active',
                        location: 'Wizard\'s Chamber',
                        purchase_date: purchaseDate2,
                        warranty_end_date: warrantyDate2,
                        attributes: {
                            manufacturer: 'Oz Technologies',
                            model: 'CB-2000',
                            power_consumption: 450,
                            cpu_model: 'Emerald i9',
                            ram_gb: 64,
                            gpu: 'Oz RTX 4090'
                        },
                        created_at: now,
                        updated_at: now
                    },
                    {
                        tenant: tenant.tenant,
                        type_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
                        company_id: emeraldCity.company_id,
                        asset_tag: 'EC-NSW-001',
                        serial_number: 'YB123456',
                        name: 'Yellow Brick Switch',
                        status: 'active',
                        location: 'Network Room',
                        purchase_date: purchaseDate3,
                        warranty_end_date: warrantyDate3,
                        attributes: {
                            manufacturer: 'Oz Networks',
                            model: 'YB-Switch-Pro',
                            power_consumption: 150,
                            ports: 48,
                            speed_gbps: 100,
                            managed: true
                        },
                        created_at: now,
                        updated_at: now
                    },
                    // Wonderland Assets
                    {
                        tenant: tenant.tenant,
                        type_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                        company_id: wonderland.company_id,
                        asset_tag: 'WL-SRV-001',
                        serial_number: 'TT987654',
                        name: 'Mad Hatter Tea Time Server',
                        status: 'active',
                        location: 'Tea Party Data Center',
                        purchase_date: purchaseDate4,
                        warranty_end_date: warrantyDate4,
                        attributes: {
                            manufacturer: 'Wonderland Systems',
                            model: 'TeaTime-X',
                            power_consumption: 800,
                            cpu_cores: 32,
                            ram_gb: 256,
                            storage_tb: 24
                        },
                        created_at: now,
                        updated_at: now
                    },
                    {
                        tenant: tenant.tenant,
                        type_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                        company_id: wonderland.company_id,
                        asset_tag: 'WL-WS-001',
                        serial_number: 'LG789123',
                        name: 'Looking Glass Workstation',
                        status: 'active',
                        location: 'Queen\'s Court',
                        purchase_date: purchaseDate5,
                        warranty_end_date: warrantyDate5,
                        attributes: {
                            manufacturer: 'Wonderland Systems',
                            model: 'Mirror-3000',
                            power_consumption: 350,
                            cpu_model: 'Cheshire i7',
                            ram_gb: 32,
                            gpu: 'Wonderland RTX 3080'
                        },
                        created_at: now,
                        updated_at: now
                    },
                    {
                        tenant: tenant.tenant,
                        type_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
                        company_id: wonderland.company_id,
                        asset_tag: 'WL-OS-001',
                        serial_number: 'RQ456123',
                        name: 'Red Queen OS',
                        status: 'active',
                        location: 'Central Systems',
                        purchase_date: purchaseDate6,
                        warranty_end_date: warrantyDate6,
                        attributes: {
                            manufacturer: 'Wonderland Software',
                            model: 'RQ-OS-2023',
                            version: '2.3.0',
                            edition: 'Enterprise',
                            architecture: '64-bit',
                            license_type: 'perpetual',
                            seats: 100
                        },
                        created_at: now,
                        updated_at: now
                    }
                ]);
            }
        });
};
