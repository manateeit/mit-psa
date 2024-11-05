'use server'

import { StorageService } from '../../storage/StorageService';
import { createTenantKnex } from '../../db';
import { marked } from 'marked';
import { PDFDocument } from 'pdf-lib';
import { fromPath } from 'pdf2pic';
import sharp from 'sharp';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { CacheFactory } from '../../cache/CacheFactory';
import Document from '../../models/document';
import { IDocument } from '../../../interfaces/document.interface';
import { v4 as uuidv4 } from 'uuid';
import { getStorageConfig } from '../../../config/storage';
import { deleteFile } from '../file-actions/fileActions';

interface PreviewResponse {
  success: boolean;
  content?: string;
  previewImage?: string;
  error?: string;
  pageCount?: number;
}

export type DocumentInput = Omit<IDocument, 'document_id'>;

interface DocumentFilters {
  type?: string;
  entityType?: string;
  uploadedBy?: string;
  searchTerm?: string;
}

// Get all documents with optional filtering
export async function getAllDocuments(filters?: DocumentFilters) {
  try {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) {
      throw new Error('No tenant found');
    }

    let query = knex('documents')
      .select(
        'documents.*',
        'users.first_name',
        'users.last_name',
        knex.raw("CONCAT(users.first_name, ' ', users.last_name) as created_by_full_name")
      )
      .leftJoin('users', 'documents.created_by', 'users.user_id')
      .where('documents.tenant', tenant)
      .orderBy('documents.entered_at', 'desc');

    if (filters) {
      // Search by document name
      if (filters.searchTerm) {
        query = query.where('documents.document_name', 'ilike', `%${filters.searchTerm}%`);
      }

      // Filter by document type
      if (filters.type) {
        query = query.where('documents.mime_type', 'like', `${filters.type}%`);
      }

      // Filter by entity type and ensure document is associated with that entity
      if (filters.entityType) {
        switch (filters.entityType) {
          case 'ticket':
            query = query.whereNotNull('documents.ticket_id');
            break;
          case 'client':
            query = query.whereNotNull('documents.company_id');
            break;
          case 'contact':
            query = query.whereNotNull('documents.contact_name_id');
            break;
          case 'schedule':
            query = query.whereNotNull('documents.schedule_id');
            break;
        }
      }

      // Filter by uploaded by (using full name)
      if (filters.uploadedBy) {
        query = query.whereRaw(
          "LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE ?",
          [`%${filters.uploadedBy.toLowerCase()}%`]
        );
      }
    }

    const documents = await query;
    return documents.map((doc): IDocument => ({
      ...doc,
      createdByFullName: doc.created_by_full_name
    }));
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error('Failed to fetch documents');
  }
}

// Centralized validation logic
async function validateDocumentUpload(file: File): Promise<void> {
  const { tenant } = await createTenantKnex();
  if (!tenant) {
    throw new Error('No tenant found');
  }
  
  await StorageService.validateFileUpload(
    tenant,
    file.type,
    file.size
  );
}

async function getDocumentTypeId(mimeType: string): Promise<string> {
  const { knex, tenant } = await createTenantKnex();
  
  // Try to find an exact match for the mime type
  const documentType = await knex('document_types')
    .where({ tenant, type_name: mimeType })
    .first();

  if (documentType) {
    return documentType.type_id;
  }

  // If no exact match, try to find a match for the general type (e.g., "image/*" for "image/png")
  const generalType = mimeType.split('/')[0] + '/*';
  const generalDocumentType = await knex('document_types')
    .where({ tenant, type_name: generalType })
    .first();

  if (generalDocumentType) {
    return generalDocumentType.type_id;
  }

  // If no match found, return the unknown type (application/octet-stream)
  const unknownType = await knex('document_types')
    .where({ tenant, type_name: 'application/octet-stream' })
    .first();

  if (!unknownType) {
    throw new Error('Unknown document type not found in database');
  }

  return unknownType.type_id;
}

export async function uploadDocument(
  file: FormData,
  options: {
    userId: string;
    companyId?: string;
    ticketId?: string;
    contactNameId?: string;
    scheduleId?: string;
  }
) {
  try {
    const { tenant } = await createTenantKnex();
    if (!tenant) {
      throw new Error('No tenant found');
    }

    // Extract file from FormData
    const fileData = file.get('file') as File;
    if (!fileData) {
      throw new Error('No file provided');
    }

    // Validate first
    await validateDocumentUpload(fileData);
    
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Upload file to storage
    const uploadResult = await StorageService.uploadFile(tenant, buffer, fileData.name, {
      mime_type: fileData.type,
      uploaded_by: options.userId
    });

    // Get document type based on mime type
    const typeId = await getDocumentTypeId(fileData.type);

    // Create document record with relationships
    const document: IDocument = {
      document_id: uuidv4(),
      document_name: fileData.name,
      content: '',
      type_id: typeId,
      user_id: options.userId,
      order_number: 0,
      created_by: options.userId,
      tenant,
      file_id: uploadResult.file_id,
      storage_path: uploadResult.storage_path,
      mime_type: fileData.type,
      file_size: fileData.size,
      company_id: options.companyId,
      ticket_id: options.ticketId,
      contact_name_id: options.contactNameId,
      schedule_id: options.scheduleId
    };

    const result = await Document.insert(document);
    
    return {
      success: true,
      document: {
        ...document,
        document_id: result.document_id
      }
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload document'
    };
  }
}

export async function addDocument(data: DocumentInput) {
  try {
    const new_document: IDocument = { 
      ...data, 
      document_id: uuidv4()
    };

    console.log('Adding document:', new_document);    
    const document = await Document.insert(new_document);
    return { _id: document.document_id };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updateDocument(documentId: string, data: Partial<IDocument>) {
  try {
    await Document.update(documentId, data);
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update the document");
  }
}

export async function deleteDocument(documentId: string, userId: string) {
  try {
    const { tenant } = await createTenantKnex();
    if (!tenant) {
      throw new Error('No tenant found');
    }

    // Get the document first to get the file_id
    const document = await Document.get(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // If there's an associated file, delete it from storage
    if (document.file_id) {
      // Delete file from storage and soft delete file record
      const deleteResult = await deleteFile(document.file_id, userId);
      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Failed to delete file from storage');
      }

      // Clear preview cache if it exists
      const cache = CacheFactory.getPreviewCache(tenant);
      await cache.delete(document.file_id);
    }

    // Delete the document record
    await Document.delete(documentId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete the document");
  }
}

export async function getDocument(documentId: string) {
  try {
    const document = await Document.get(documentId);
    return document;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get the document");
  }
}

export async function getDocumentByTicketId(ticketId: string) {
  try {
    const documents = await Document.getByTicketId(ticketId);
    return documents;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get the documents");
  }
}

export async function getDocumentByCompanyId(companyId: string) {
  try {
    const documents = await Document.getByCompanyId(companyId);
    return documents;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get the documents");
  }
}

export async function getDocumentByContactNameId(contactNameId: string) {
  try {
    const documents = await Document.getByContactNameId(contactNameId);
    return documents;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get the documents");
  }
}

export async function getDocumentPreview(
  file_id: string
): Promise<PreviewResponse> {
  try {
    const { tenant } = await createTenantKnex();
    if (!tenant) {
      throw new Error('No tenant found');
    }

    // Get cache instance for this tenant
    const cache = CacheFactory.getPreviewCache(tenant);

    // Check if preview exists in cache
    const cachedPreview = await cache.get(file_id);
    if (cachedPreview) {
      // Read the cached preview image
      const imageBuffer = await sharp(cachedPreview).toBuffer();
      const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      
      return {
        success: true,
        previewImage: base64Image,
        content: 'PDF Document'
      };
    }

    const result = await StorageService.downloadFile(tenant, file_id);
    if (!result) {
      throw new Error('File not found');
    }

    const { buffer, metadata } = result;
    const mime = metadata.mime_type.toLowerCase();

    // Handle different file types
    if (mime === 'application/pdf') {
      try {
        // First get basic PDF info
        const pdfDoc = await PDFDocument.load(buffer);
        const pageCount = pdfDoc.getPages().length;

        const config = getStorageConfig();

        // Create temp directory for processing
        const tempDir = join(config.providers[config.defaultProvider!].basePath!, 'pdf-previews');
        const tempPdfPath = join(tempDir, `${file_id}.pdf`);
        
        try {
          // Ensure temp directory exists
          await writeFile(tempPdfPath, buffer);

          // Set up pdf2pic options
          const options = {
            density: 100,
            saveFilename: `${file_id}_thumb`,
            savePath: tempDir,
            format: "png",
            width: 600,
            height: 600,
            quality: 75,
            compression: "jpeg",
            useIMagick: true // Use ImageMagick instead of GraphicsMagick
          };

          // Convert PDF to image
          const convert = fromPath(tempPdfPath, options);
          const pageToConvertAsImage = 1;
          const result = await convert(pageToConvertAsImage);

          // Read the generated image and optimize it
          const imageBuffer = await sharp(result.path)
            .resize(400, 400, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .png({ quality: 80 })
            .toBuffer();

          // Store in cache
          await cache.set(file_id, imageBuffer);

          // Convert to base64
          const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

          // Clean up temp files
          await Promise.all([
            unlink(tempPdfPath),
            unlink(result.path!)
          ]);

          return { 
            success: true,
            previewImage: base64Image,
            pageCount,
            content: `PDF Document\nPages: ${pageCount}`
          };
        } catch (conversionError) {
          console.error('PDF conversion error:', conversionError);
          // Clean up temp file if it exists
          try {
            await unlink(tempPdfPath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          // Fallback to basic info if image conversion fails
          return { 
            success: true,
            pageCount,
            content: `PDF Document\nPages: ${pageCount}\n\nPreview image generation failed.`
          };
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return {
          success: false,
          error: 'Failed to parse PDF document'
        };
      }
    }

    // Handle markdown files
    if (mime === 'text/markdown' || metadata.original_name.endsWith('.md')) {
      try {
        const markdown = buffer.toString('utf-8');
        const html = await marked(markdown, { async: true });
        return { success: true, content: html };
      } catch (markdownError) {
        console.error('Markdown parsing error:', markdownError);
        return {
          success: false,
          error: 'Failed to parse markdown document'
        };
      }
    }

    // Handle text files
    if (mime.startsWith('text/') || mime === 'application/json') {
      try {
        const text = buffer.toString('utf-8');
        // For JSON, try to format it
        if (mime === 'application/json') {
          const obj = JSON.parse(text);
          return { success: true, content: JSON.stringify(obj, null, 2) };
        }
        return { success: true, content: text };
      } catch (textError) {
        console.error('Text parsing error:', textError);
        return {
          success: false,
          error: 'Failed to parse text document'
        };
      }
    }

    // For unsupported types
    return { 
      success: false, 
      error: 'Preview not available for this file type' 
    };
  } catch (error) {
    console.error('Preview file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview file'
    };
  }
}
