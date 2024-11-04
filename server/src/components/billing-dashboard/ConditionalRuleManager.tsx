import React, { useState, useEffect } from 'react';
import { IConditionalRule, IInvoiceTemplate } from '@/interfaces/invoice.interfaces';
import { getConditionalRules, saveConditionalRule } from '@/lib/actions/invoiceActions';

interface ConditionalRuleManagerProps {
  template: IInvoiceTemplate;
}

const ConditionalRuleManager: React.FC<ConditionalRuleManagerProps> = ({ template }) => {
  const [rules, setRules] = useState<IConditionalRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<IConditionalRule>>({});

  useEffect(() => {
    fetchRules();
  }, [template.template_id]);

  const fetchRules = async () => {
    const fetchedRules = await getConditionalRules(template.template_id);
    setRules(fetchedRules);
  };

  const handleSaveRule = async () => {
    if (newRule.condition && newRule.action && newRule.target) {
      await saveConditionalRule({
        ...newRule,
        template_id: template.template_id,
      } as IConditionalRule);
      fetchRules();
      setNewRule({});
    }
  };

  return (
    <div>
      <h3>Conditional Display Rules</h3>
      <ul>
        {rules.map((rule):JSX.Element => (
          <li key={rule.rule_id}>
            {rule.condition} - {rule.action} - {rule.target}
          </li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          placeholder="Condition"
          value={newRule.condition || ''}
          onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
        />
        <select
          value={newRule.action || ''}
          onChange={(e) => setNewRule({...newRule, action: e.target.value as IConditionalRule['action']})}
        >
          <option value="">Select Action</option>
          <option value="show">Show</option>
          <option value="hide">Hide</option>
          <option value="format">Format</option>
        </select>
        <input
          type="text"
          placeholder="Target"
          value={newRule.target || ''}
          onChange={(e) => setNewRule({...newRule, target: e.target.value})}
        />
        <button onClick={handleSaveRule}>Add Rule</button>
      </div>
    </div>
  );
};

export default ConditionalRuleManager;
