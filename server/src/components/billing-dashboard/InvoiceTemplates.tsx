// InvoiceTemplates.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getInvoiceTemplates } from '@/lib/actions/invoiceActions';
import { IInvoiceTemplate } from '@/interfaces/invoice.interfaces';
import InvoiceTemplateManager from './InvoiceTemplateManager';
import TemplateSelector from './TemplateSelector';
import TemplateRenderer from './TemplateRenderer';

const InvoiceTemplates: React.FC = () => {
  const [invoiceTemplates, setInvoiceTemplates] = useState<IInvoiceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<IInvoiceTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const templates = await getInvoiceTemplates();
      setInvoiceTemplates(templates);
      setError(null);
    } catch (error) {
      console.error('Error fetching invoice templates:', error);
      setError('Failed to fetch invoice templates');
    }
  };

  const handleTemplateSelect = (template: IInvoiceTemplate) => {
    setSelectedTemplate(template);
  };

  const handleTemplatesUpdate = (updatedTemplates: IInvoiceTemplate[]) => {
    setInvoiceTemplates(updatedTemplates);
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Invoice Templates</h3>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <InvoiceTemplateManager
            templates={invoiceTemplates}
            onTemplateSelect={handleTemplateSelect}
            selectedTemplate={selectedTemplate}
          />
          <Button onClick={fetchTemplates}>Refresh Templates</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceTemplates;
