// server/src/components/InvoiceTemplateManager.tsx
import React, { useState } from 'react';
import { IInvoiceTemplate, IInvoice, InvoiceViewModel } from '@/interfaces/invoice.interfaces';
import TemplateSelector from './TemplateSelector';
import TemplateRenderer from './TemplateRenderer';
import CustomSelect from '@/components/ui/CustomSelect';
import { sampleInvoices } from '@/utils/sampleInvoiceData';
import PaperInvoice from './PaperInvoice';

interface InvoiceTemplateManagerProps {
  templates: IInvoiceTemplate[];
  onTemplateSelect: (template: IInvoiceTemplate) => void;
  selectedTemplate: IInvoiceTemplate | null;
}

const InvoiceTemplateManager: React.FC<InvoiceTemplateManagerProps> = ({
  templates,
  onTemplateSelect,
  selectedTemplate
}) => {
  const [localTemplates, setLocalTemplates] = useState<IInvoiceTemplate[]>(templates);
  const [selectedSampleInvoice, setSelectedSampleInvoice] = useState<InvoiceViewModel>(sampleInvoices[0]);

  const handleTemplatesUpdate = (updatedTemplates: IInvoiceTemplate[]) => {
    setLocalTemplates(updatedTemplates);
    // If you need to update templates in a parent component, you can add a prop for that
    // onTemplatesUpdate(updatedTemplates);
  };

  const handleSampleInvoiceSelect = (invoice_number: string) => {
    const selectedInvoice = sampleInvoices.find(invoice => invoice.invoice_number === invoice_number);
    if (selectedInvoice) {
      setSelectedSampleInvoice(selectedInvoice);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Invoice Template Manager</h2>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Select Template</h3>
        <TemplateSelector
          templates={localTemplates}
          onTemplateSelect={onTemplateSelect}
          onTemplatesUpdate={handleTemplatesUpdate}
          selectedTemplate={selectedTemplate}
        />
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Select Sample Invoice</h3>
        <CustomSelect
          options={sampleInvoices.map((invoice): { value: string; label: string } => ({
            value: invoice.invoice_number,
            label: `Invoice #${invoice.invoice_number} - ${invoice.custom_fields?.project}`
          }))}
          onValueChange={handleSampleInvoiceSelect}
          value={selectedSampleInvoice.invoice_number}
          placeholder="Select sample invoice..."
        />
      </div>
      {selectedTemplate && selectedSampleInvoice && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Template Preview</h3>
          {selectedTemplate && selectedSampleInvoice && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Template Preview</h3>
              <PaperInvoice>
                <TemplateRenderer template={selectedTemplate} invoiceData={selectedSampleInvoice} />
              </PaperInvoice>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceTemplateManager;
