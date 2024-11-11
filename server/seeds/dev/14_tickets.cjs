exports.seed = function (knex) {
    return knex('tickets').del()
        .then(() => {
            return knex('tickets').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    title: 'Missing White Rabbit',
                    company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Emerald City' }).select('company_id').first(),
                    contact_name_id: knex('contacts').where({ tenant: '11111111-1111-1111-1111-111111111111' }).whereRaw("full_name ILIKE '%alice%'").select('contact_name_id').first(),
                    status_id: knex('statuses').where({ tenant: '11111111-1111-1111-1111-111111111111', name: 'Curious Beginning' }).select('status_id').first(),
                    channel_id: knex('channels').where({ tenant: '11111111-1111-1111-1111-111111111111', channel_name: 'Urgent Matters' }).select('channel_id').first(),
                    category_id: knex('categories').where({ tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Magical Artifacts' }).select('category_id').first(),
                    subcategory_id: knex('categories').where({ tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Enchanted Accessories' }).select('category_id').first(),
                    priority_id: knex('priorities').where({ tenant: '11111111-1111-1111-1111-111111111111', priority_name: 'Enchanted Emergency' }).select('priority_id').first(),
                    severity_id: knex('severities').where({ tenant: '11111111-1111-1111-1111-111111111111', severity_name: 'Serious Snarl' }).select('severity_id').first(),
                    urgency_id: knex('urgencies').where({ tenant: '11111111-1111-1111-1111-111111111111', urgency_name: 'Hare-Paced Hustle' }).select('urgency_id').first(),
                    impact_id: knex('impacts').where({ tenant: '11111111-1111-1111-1111-111111111111', impact_name: 'Realm-Wide Repercussions' }).select('impact_id').first(),
                    entered_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    assigned_to: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'tinman' }).select('user_id').first(),
                    entered_at: knex.fn.now()
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    title: 'Survey Uncharted Areas in Wonderland',
                    company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Wonderland' }).select('company_id').first(),
                    contact_name_id: knex('contacts').where({ tenant: '11111111-1111-1111-1111-111111111111' }).whereRaw("full_name ILIKE '%alice%'").select('contact_name_id').first(),
                    status_id: knex('statuses').where({ tenant: '11111111-1111-1111-1111-111111111111', name: 'Awaiting Wisdom' }).select('status_id').first(),
                    channel_id: knex('channels').where({ tenant: '11111111-1111-1111-1111-111111111111', channel_name: 'Urgent Matters' }).select('channel_id').first(),
                    category_id: knex('categories').where({ tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Character Assistance' }).select('category_id').first(),
                    subcategory_id: knex('categories').where({ tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Quest Guidance' }).select('category_id').first(),
                    priority_id: knex('priorities').where({ tenant: '11111111-1111-1111-1111-111111111111', priority_name: 'Enchanted Emergency' }).select('priority_id').first(),
                    severity_id: knex('severities').where({ tenant: '11111111-1111-1111-1111-111111111111', severity_name: 'Moderate Muddle' }).select('severity_id').first(),
                    urgency_id: knex('urgencies').where({ tenant: '11111111-1111-1111-1111-111111111111', urgency_name: 'Tick-Tock Task' }).select('urgency_id').first(),
                    impact_id: knex('impacts').where({ tenant: '11111111-1111-1111-1111-111111111111', impact_name: 'Local Disruption' }).select('impact_id').first(),
                    entered_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    assigned_to: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'madhatter' }).select('user_id').first(),
                    entered_at: knex.raw("CURRENT_TIMESTAMP - INTERVAL '2 months'")
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    title: 'Enhance Emerald City Gardens',
                    company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Emerald City' }).select('company_id').first(),
                    contact_name_id: knex('contacts').where({ tenant: '11111111-1111-1111-1111-111111111111' }).whereRaw("full_name ILIKE '%dorothy%'").select('contact_name_id').first(),
                    status_id: knex('statuses').where({ tenant: '11111111-1111-1111-1111-111111111111', name: 'Unfolding Adventure' }).select('status_id').first(),
                    channel_id: knex('channels').where({ tenant: '11111111-1111-1111-1111-111111111111', channel_name: 'Projects' }).select('channel_id').first(),
                    category_id: knex('categories').where({ tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Realm Maintenance' }).select('category_id').first(),
                    subcategory_id: knex('categories').where({ tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Magical Infrastructure' }).select('category_id').first(),
                    priority_id: knex('priorities').where({ tenant: '11111111-1111-1111-1111-111111111111', priority_name: 'Curious Conundrum' }).select('priority_id').first(),
                    severity_id: knex('severities').where({ tenant: '11111111-1111-1111-1111-111111111111', severity_name: 'Moderate Muddle' }).select('severity_id').first(),
                    urgency_id: knex('urgencies').where({ tenant: '11111111-1111-1111-1111-111111111111', urgency_name: 'Tick-Tock Task' }).select('urgency_id').first(),
                    impact_id: knex('impacts').where({ tenant: '11111111-1111-1111-1111-111111111111', impact_name: 'Local Disruption' }).select('impact_id').first(),
                    entered_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    assigned_to: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'scarecrow' }).select('user_id').first(),
                    entered_at: knex.raw("CURRENT_TIMESTAMP - INTERVAL '1 month'")
                }
            ]);
        });
};