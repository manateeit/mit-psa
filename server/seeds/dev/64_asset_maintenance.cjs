exports.seed = async function(knex) {
    // Clean up existing data
    await knex('asset_maintenance_history').del();
    await knex('asset_maintenance_notifications').del();
    await knex('asset_maintenance_schedules').del();

    const tenant = await knex('tenants').select('tenant').first();
    const scarecrow = await knex('users').where({ username: 'scarecrow' }).first();
    const madhatter = await knex('users').where({ username: 'madhatter' }).first();
    const assets = await knex('assets').select('asset_id', 'name');

    if (tenant && scarecrow && madhatter) {
        // Get specific assets
        const rubyServer = assets.find(a => a.name === 'Ruby Slippers Server');
        const teaServer = assets.find(a => a.name === 'Mad Hatter Tea Time Server');
        const crystalWorkstation = assets.find(a => a.name === 'Crystal Ball Workstation');
        const lookingGlassWS = assets.find(a => a.name === 'Looking Glass Workstation');

        const now = new Date();
        const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Insert maintenance schedules
        const [schedule1, schedule2, schedule3, schedule4] = await knex('asset_maintenance_schedules').insert([
            {
                tenant: tenant.tenant,
                asset_id: rubyServer.asset_id,
                schedule_name: 'Magical Power Calibration',
                description: 'Regular calibration of ruby energy crystals',
                maintenance_type: 'calibration',
                frequency: 'monthly',
                frequency_interval: 1,
                schedule_config: {
                    requires_shutdown: true,
                    estimated_duration: '2 hours',
                    special_tools: ['Crystal Calibrator', 'Magic Wand']
                },
                next_maintenance: twoWeeksFromNow.toISOString(),
                created_by: scarecrow.user_id,
                created_at: now.toISOString(),
                updated_at: now.toISOString()
            },
            {
                tenant: tenant.tenant,
                asset_id: teaServer.asset_id,
                schedule_name: 'Tea Time Optimization',
                description: 'Ensure server performance peaks at tea time',
                maintenance_type: 'preventive',
                frequency: 'weekly',
                frequency_interval: 1,
                schedule_config: {
                    requires_shutdown: false,
                    estimated_duration: '1 hour',
                    optimal_time: '4:00 PM',
                    tea_type: 'Earl Grey'
                },
                next_maintenance: threeDaysFromNow.toISOString(),
                created_by: madhatter.user_id,
                created_at: now.toISOString(),
                updated_at: now.toISOString()
            },
            {
                tenant: tenant.tenant,
                asset_id: crystalWorkstation.asset_id,
                schedule_name: 'Crystal Ball Clarity Check',
                description: 'Maintain optimal clarity for future predictions',
                maintenance_type: 'inspection',
                frequency: 'quarterly',
                frequency_interval: 1,
                schedule_config: {
                    requires_shutdown: false,
                    estimated_duration: '30 minutes',
                    clarity_threshold: '98%'
                },
                next_maintenance: oneMonthFromNow.toISOString(),
                created_by: scarecrow.user_id,
                created_at: now.toISOString(),
                updated_at: now.toISOString()
            },
            {
                tenant: tenant.tenant,
                asset_id: lookingGlassWS.asset_id,
                schedule_name: 'Mirror Polish and Alignment',
                description: 'Keep the looking glass perfectly aligned',
                maintenance_type: 'preventive',
                frequency: 'monthly',
                frequency_interval: 1,
                schedule_config: {
                    requires_shutdown: true,
                    estimated_duration: '1 hour',
                    polish_type: 'Wonderland Special'
                },
                next_maintenance: fiveDaysFromNow.toISOString(),
                created_by: madhatter.user_id,
                created_at: now.toISOString(),
                updated_at: now.toISOString()
            }
        ]).returning(['schedule_id', 'asset_id']);

        // Insert maintenance history
        await knex('asset_maintenance_history').insert([
            {
                tenant: tenant.tenant,
                schedule_id: schedule1.schedule_id,
                asset_id: schedule1.asset_id,
                maintenance_type: 'calibration',
                description: 'Initial calibration of ruby energy crystals',
                maintenance_data: {
                    power_level: '98%',
                    crystal_alignment: 'optimal',
                    notes: 'Ruby slippers energy signature stable'
                },
                performed_at: oneMonthAgo.toISOString(),
                performed_by: scarecrow.user_id,
                created_at: oneMonthAgo.toISOString()
            },
            {
                tenant: tenant.tenant,
                schedule_id: schedule2.schedule_id,
                asset_id: schedule2.asset_id,
                maintenance_type: 'preventive',
                description: 'Weekly tea time optimization completed',
                maintenance_data: {
                    tea_temperature: '98°C',
                    steeping_time: '4 minutes',
                    performance_boost: '15%'
                },
                performed_at: oneWeekAgo.toISOString(),
                performed_by: madhatter.user_id,
                created_at: oneWeekAgo.toISOString()
            }
        ]);

        // Insert notifications
        await knex('asset_maintenance_notifications').insert([
            {
                tenant: tenant.tenant,
                schedule_id: schedule1.schedule_id,
                asset_id: schedule1.asset_id,
                notification_type: 'upcoming',
                notification_date: twoWeeksFromNow.toISOString(),
                notification_data: {
                    schedule_name: 'Magical Power Calibration',
                    maintenance_type: 'calibration',
                    asset_name: rubyServer.name
                },
                created_at: now.toISOString()
            },
            {
                tenant: tenant.tenant,
                schedule_id: schedule2.schedule_id,
                asset_id: schedule2.asset_id,
                notification_type: 'upcoming',
                notification_date: threeDaysFromNow.toISOString(),
                notification_data: {
                    schedule_name: 'Tea Time Optimization',
                    maintenance_type: 'preventive',
                    asset_name: teaServer.name
                },
                created_at: now.toISOString()
            }
        ]);
    }
};
