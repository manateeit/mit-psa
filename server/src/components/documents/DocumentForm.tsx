// server/src/components/documents/DocumentForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { IDocument } from '@/interfaces/document.interface';

interface DocumentFormProps {
  onSubmit: (data: Partial<IDocument>) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<Partial<IDocument>>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="document_name" className="block text-sm font-medium text-gray-700">Document Name</label>
        <input
          type="text"
          id="document_name"
          {...register('document_name', { required: 'Document name is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        {errors.document_name && <p className="mt-1 text-sm text-red-600">{errors.document_name.message}</p>}
      </div>

      <div>
        <label htmlFor="type_id" className="block text-sm font-medium text-gray-700">Document Type ID</label>
        <input
          type="text"
          id="type_id"
          {...register('type_id', { required: 'Document type ID is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        {errors.type_id && <p className="mt-1 text-sm text-red-600">{errors.type_id.message}</p>}
      </div>

      <div>
        <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">User ID</label>
        <input
          type="text"
          id="user_id"
          {...register('user_id', { required: 'User ID is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        {errors.user_id && <p className="mt-1 text-sm text-red-600">{errors.user_id.message}</p>}
      </div>

      <div>
        <label htmlFor="contact_name_id" className="block text-sm font-medium text-gray-700">Contact Name ID</label>
        <input
          type="text"
          id="contact_name_id"
          {...register('contact_name_id')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">Company ID</label>
        <input
          type="text"
          id="company_id"
          {...register('company_id')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label htmlFor="ticket_id" className="block text-sm font-medium text-gray-700">Ticket ID</label>
        <input
          type="text"
          id="ticket_id"
          {...register('ticket_id')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label htmlFor="order_number" className="block text-sm font-medium text-gray-700">Order Number</label>
        <input
          type="number"
          id="order_number"
          {...register('order_number', { required: 'Order number is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        {errors.order_number && <p className="mt-1 text-sm text-red-600">{errors.order_number.message}</p>}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
        <textarea
          id="content"
          {...register('content', { required: 'Content is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          rows={4}
        />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Create Document
      </button>
    </form>
  );
};

export default DocumentForm;
