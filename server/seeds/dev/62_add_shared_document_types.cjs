/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // First, delete existing entries to ensure clean state
  await knex('shared_document_types').del();
  
  // Insert common document types
  await knex('shared_document_types').insert([
    // Documents
    {
      type_name: 'application/pdf',
      icon: '📄',
      description: 'PDF Document'
    },
    {
      type_name: 'application/msword',
      icon: '📝',
      description: 'Microsoft Word Document'
    },
    {
      type_name: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      icon: '📝',
      description: 'Microsoft Word Document (DOCX)'
    },
    {
      type_name: 'application/vnd.ms-excel',
      icon: '📊',
      description: 'Microsoft Excel Spreadsheet'
    },
    {
      type_name: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      icon: '📊',
      description: 'Microsoft Excel Spreadsheet (XLSX)'
    },
    {
      type_name: 'application/vnd.ms-powerpoint',
      icon: '📽️',
      description: 'Microsoft PowerPoint Presentation'
    },
    {
      type_name: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      icon: '📽️',
      description: 'Microsoft PowerPoint Presentation (PPTX)'
    },

    // Images
    {
      type_name: 'image/*',
      icon: '🖼️',
      description: 'Image File'
    },
    {
      type_name: 'image/jpeg',
      icon: '🖼️',
      description: 'JPEG Image'
    },
    {
      type_name: 'image/png',
      icon: '🖼️',
      description: 'PNG Image'
    },
    {
      type_name: 'image/gif',
      icon: '🖼️',
      description: 'GIF Image'
    },
    {
      type_name: 'image/svg+xml',
      icon: '🖼️',
      description: 'SVG Image'
    },

    // Text files
    {
      type_name: 'text/*',
      icon: '📝',
      description: 'Text File'
    },
    {
      type_name: 'text/plain',
      icon: '📝',
      description: 'Plain Text File'
    },
    {
      type_name: 'text/markdown',
      icon: '📝',
      description: 'Markdown Document'
    },
    {
      type_name: 'text/csv',
      icon: '📊',
      description: 'CSV File'
    },
    {
      type_name: 'text/html',
      icon: '🌐',
      description: 'HTML File'
    },

    // Archives
    {
      type_name: 'application/zip',
      icon: '📦',
      description: 'ZIP Archive'
    },
    {
      type_name: 'application/x-rar-compressed',
      icon: '📦',
      description: 'RAR Archive'
    },
    {
      type_name: 'application/x-7z-compressed',
      icon: '📦',
      description: '7-Zip Archive'
    },
    {
      type_name: 'application/x-tar',
      icon: '📦',
      description: 'TAR Archive'
    },
    {
      type_name: 'application/gzip',
      icon: '📦',
      description: 'GZIP Archive'
    },

    // Audio
    {
      type_name: 'audio/*',
      icon: '🎵',
      description: 'Audio File'
    },
    {
      type_name: 'audio/mpeg',
      icon: '🎵',
      description: 'MP3 Audio'
    },
    {
      type_name: 'audio/wav',
      icon: '🎵',
      description: 'WAV Audio'
    },

    // Video
    {
      type_name: 'video/*',
      icon: '🎥',
      description: 'Video File'
    },
    {
      type_name: 'video/mp4',
      icon: '🎥',
      description: 'MP4 Video'
    },
    {
      type_name: 'video/quicktime',
      icon: '🎥',
      description: 'QuickTime Video'
    },

    // Code files
    {
      type_name: 'text/javascript',
      icon: '👨‍💻',
      description: 'JavaScript File'
    },
    {
      type_name: 'text/typescript',
      icon: '👨‍💻',
      description: 'TypeScript File'
    },
    {
      type_name: 'text/x-python',
      icon: '👨‍💻',
      description: 'Python File'
    },
    {
      type_name: 'text/x-java',
      icon: '👨‍💻',
      description: 'Java File'
    },

    // Fallback type
    {
      type_name: 'application/octet-stream',
      icon: '📄',
      description: 'Unknown File Type'
    }
  ]);
};
