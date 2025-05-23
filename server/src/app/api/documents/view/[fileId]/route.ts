import { NextRequest, NextResponse } from 'next/server';
import { createTenantKnex } from 'server/src/lib/db';
import { StorageProviderFactory } from 'server/src/lib/storage/StorageProviderFactory';
import { FileStoreModel } from 'server/src/models/storage';
import { getCurrentUser } from 'server/src/lib/actions/user-actions/userActions';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const fileId = params.fileId;

  if (!fileId) {
    return new NextResponse('File ID is required', { status: 400 });
  }

  try {
    const { knex, tenant } = await createTenantKnex();
    const user = await getCurrentUser(); // Get authenticated user

    if (!tenant || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const fileRecord = await FileStoreModel.findById(fileId);

    if (!fileRecord || fileRecord.tenant !== tenant) {
      return new NextResponse('File not found', { status: 404 });
    }

    // --- Permission Check ---
    let hasPermission = false;
    let associatedCompanyId: string | null = null;
    let userCompanyId: string | null = null;

    // 1. Check if user is internal
    if (user.user_type === 'internal') { 
        hasPermission = true; // Internal users can view all company logos
    } else {
        // 2. If not internal, check if it's associated with the user's company
        // Find the document record linked to this file_id
        const documentRecord = await knex('documents')
          .select('document_id')
          .where({ file_id: fileId, tenant })
          .first();

        if (documentRecord) {
          // Find the company association for this document
          const association = await knex('document_associations')
            .select('entity_id')
            .where({
              document_id: documentRecord.document_id,
              entity_type: 'company',
              tenant: tenant
            })
            .first();
          
          associatedCompanyId = association?.entity_id ?? null;
        }

        if (associatedCompanyId && user.contact_id) {
           // Fetch the user's company_id via their contact record
           const contactRecord = await knex('contacts')
              .select('company_id')
              .where({ contact_name_id: user.contact_id, tenant })
              .first();
           
           userCompanyId = contactRecord?.company_id ?? null;

           // Allow access ONLY if the user's company matches the document's associated company
           if (userCompanyId === associatedCompanyId) {
              hasPermission = true;
           }
        }
    }

    if (!hasPermission) {
       console.warn(`User ${user.user_id} (type: ${user.user_type}) does not have permission to view file ${fileId}. AssociatedCompany: ${associatedCompanyId}, UserCompany: ${userCompanyId}`);
       return new NextResponse('Forbidden', { status: 403 });
    }
    console.log(`User ${user.user_id} has permission to view file ${fileId}`);

    // Ensure it's an image type (or allow other types if needed)
    if (!fileRecord.mime_type?.startsWith('image/')) {
        // Allow SVG as well
       if (fileRecord.mime_type !== 'image/svg+xml') {
         console.warn(`Attempted to view non-image file: ${fileId}, MIME: ${fileRecord.mime_type}`);
         return new NextResponse('File is not a viewable image', { status: 400 });
       }
    }

    // Get the storage provider instance
    const provider = await StorageProviderFactory.createProvider();

    // Get the readable stream for the file
    const stream = await provider.getReadStream(fileRecord.storage_path);

    // Set headers
    const headers = new Headers();
    headers.set('Content-Type', fileRecord.mime_type);
    // Cache for 1 hour (adjust as needed)
    headers.set('Cache-Control', 'public, max-age=3600');
    // Optional: Content-Length if easily available, but streaming usually handles this
    // headers.set('Content-Length', fileRecord.file_size.toString());

    // Return the stream response
    // Note: NextResponse can directly handle ReadableStream
    return new NextResponse(stream as any, { // Cast needed for NextResponse type compatibility
      status: 200,
      headers,
    });

  } catch (error) {
    console.error(`Error serving file ${fileId}:`, error);
    if (error instanceof Error && error.message.includes('File not found')) {
        return new NextResponse('File not found in storage', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}