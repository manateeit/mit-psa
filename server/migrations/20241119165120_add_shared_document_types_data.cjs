/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex('shared_document_types').insert([
        {
            type_name: 'JPEG Image',
            icon: '📸',
            description: 'image/jpeg'
        },
        {
            type_name: 'PNG Image',
            icon: '🖼️',
            description: 'image/png'
        },
        {
            type_name: 'GIF Image',
            icon: '🎭',
            description: 'image/gif'
        },
        {
            type_name: 'SVG Image',
            icon: '🎨',
            description: 'image/svg+xml'
        },
        {
            type_name: 'WebP Image',
            icon: '📸',
            description: 'image/webp'
        },
        {
            type_name: 'PDF Document',
            icon: '📄',
            description: 'application/pdf'
        },
        {
            type_name: 'Word Document',
            icon: '📝',
            description: 'application/msword'
        },
        {
            type_name: 'Word Document (DOCX)',
            icon: '📝',
            description: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        },
        {
            type_name: 'Excel Spreadsheet',
            icon: '📊',
            description: 'application/vnd.ms-excel'
        },
        {
            type_name: 'Excel Spreadsheet (XLSX)',
            icon: '📊',
            description: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        {
            type_name: 'PowerPoint Presentation',
            icon: '📽️',
            description: 'application/vnd.ms-powerpoint'
        },
        {
            type_name: 'PowerPoint Presentation (PPTX)',
            icon: '📽️',
            description: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        },
        {
            type_name: 'Plain Text',
            icon: '📝',
            description: 'text/plain'
        },
        {
            type_name: 'HTML Document',
            icon: '🌐',
            description: 'text/html'
        },
        {
            type_name: 'CSS Stylesheet',
            icon: '🎨',
            description: 'text/css'
        },
        {
            type_name: 'JavaScript Code',
            icon: '⚙️',
            description: 'text/javascript'
        },
        {
            type_name: 'Markdown Document',
            icon: '📑',
            description: 'text/markdown'
        },
        {
            type_name: 'ZIP Archive',
            icon: '📦',
            description: 'application/zip'
        },
        {
            type_name: 'RAR Archive',
            icon: '📦',
            description: 'application/x-rar-compressed'
        },
        {
            type_name: '7-Zip Archive',
            icon: '📦',
            description: 'application/x-7z-compressed'
        },
        {
            type_name: 'TAR Archive',
            icon: '📦',
            description: 'application/x-tar'
        },
        {
            type_name: 'GZIP Archive',
            icon: '📦',
            description: 'application/gzip'
        },
        {
            type_name: 'MP3 Audio',
            icon: '🎵',
            description: 'audio/mpeg'
        },
        {
            type_name: 'WAV Audio',
            icon: '🎵',
            description: 'audio/wav'
        },
        {
            type_name: 'OGG Audio',
            icon: '🎵',
            description: 'audio/ogg'
        },
        {
            type_name: 'MP4 Video',
            icon: '🎥',
            description: 'video/mp4'
        },
        {
            type_name: 'WebM Video',
            icon: '🎥',
            description: 'video/webm'
        },
        {
            type_name: 'OGG Video',
            icon: '🎥',
            description: 'video/ogg'
        },
        {
            type_name: 'JSON Data',
            icon: '📊',
            description: 'application/json'
        },
        {
            type_name: 'XML Data',
            icon: '📊',
            description: 'application/xml'
        },
        {
            type_name: 'CSV Data',
            icon: '📊',
            description: 'text/csv'
        },
        {
            type_name: 'Unknown File Type',
            icon: '❓',
            description: 'application/octet-stream'
        }
    ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex('shared_document_types').del();
};
