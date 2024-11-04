const { v4: uuidv4, v4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // First, clear existing document types
    await knex('document_types').del();

    // add the description field to the table
    await knex.schema.table('document_types', table => {
        table.string('description');
    });

    const documentTypes = [
        // Images
        { type_name: 'image/jpeg', type_id: v4(), icon: '📸', description: 'JPEG Image' },
        { type_name: 'image/png', icon: '🖼️', description: 'PNG Image' },
        { type_name: 'image/gif', icon: '🎭', description: 'GIF Image' },
        { type_name: 'image/svg+xml', icon: '🎨', description: 'SVG Image' },
        { type_name: 'image/webp', icon: '📸', description: 'WebP Image' },
        
        // Documents
        { type_name: 'application/pdf', icon: '📄', description: 'PDF Document' },
        { type_name: 'application/msword', icon: '📝', description: 'Word Document' },
        { type_name: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: '📝', description: 'Word Document' },
        { type_name: 'application/vnd.ms-excel', icon: '📊', description: 'Excel Spreadsheet' },
        { type_name: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', icon: '📊', description: 'Excel Spreadsheet' },
        { type_name: 'application/vnd.ms-powerpoint', icon: '📽️', description: 'PowerPoint Presentation' },
        { type_name: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', icon: '📽️', description: 'PowerPoint Presentation' },
        
        // Text
        { type_name: 'text/plain', icon: '📝', description: 'Plain Text' },
        { type_name: 'text/html', icon: '🌐', description: 'HTML Document' },
        { type_name: 'text/css', icon: '🎨', description: 'CSS Stylesheet' },
        { type_name: 'text/javascript', icon: '⚙️', description: 'JavaScript Code' },
        { type_name: 'text/markdown', icon: '📑', description: 'Markdown Document' },
        
        // Archives
        { type_name: 'application/zip', icon: '📦', description: 'ZIP Archive' },
        { type_name: 'application/x-rar-compressed', icon: '📦', description: 'RAR Archive' },
        { type_name: 'application/x-7z-compressed', icon: '📦', description: '7-Zip Archive' },
        { type_name: 'application/x-tar', icon: '📦', description: 'TAR Archive' },
        { type_name: 'application/gzip', icon: '📦', description: 'GZIP Archive' },
        
        // Audio
        { type_name: 'audio/mpeg', icon: '🎵', description: 'MP3 Audio' },
        { type_name: 'audio/wav', icon: '🎵', description: 'WAV Audio' },
        { type_name: 'audio/ogg', icon: '🎵', description: 'OGG Audio' },
        
        // Video
        { type_name: 'video/mp4', icon: '🎥', description: 'MP4 Video' },
        { type_name: 'video/webm', icon: '🎥', description: 'WebM Video' },
        { type_name: 'video/ogg', icon: '🎥', description: 'OGG Video' },
        
        // Data
        { type_name: 'application/json', icon: '📊', description: 'JSON Data' },
        { type_name: 'application/xml', icon: '📊', description: 'XML Data' },
        { type_name: 'text/csv', icon: '📊', description: 'CSV Data' },
        
        // Catch-all for unknown types
        { type_name: 'application/octet-stream', icon: '❓', description: 'Unknown File Type' }
    ];

    // Add type_id and tenant to each record
    // Get the first tenant from the database
    const firstTenant = await knex('tenants').first();
    if (!firstTenant) {
        throw new Error('No tenants found in the database');
    }

    const records = documentTypes.map(type => ({
        ...type,
        type_id: uuidv4(),
        tenant: firstTenant.tenant
    }));

    // Insert the records
    await knex('document_types').insert(records);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    // Remove all the document types we added
    await knex('document_types').del();
};
