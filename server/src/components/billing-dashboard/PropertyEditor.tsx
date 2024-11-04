import { LayoutBlock } from "@/interfaces/invoice.interfaces";
import styles from './InvoiceDesigner.module.css';

interface PropertyEditorProps {
    block?: LayoutBlock;
    onUpdate: (updates: Partial<LayoutBlock>) => void;
    availableFields: string[];
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ block, onUpdate, availableFields }) => {
    if (!block) return null;

    return (
        <div className={styles.propertyEditorContent}>
            {block.type === 'text' && (
                <label className={styles.propertyLabel}>
                    Content:
                    <input
                        type="text"
                        value={block.content}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                    />
                </label>
            )}
            {block.type === 'dynamic' && (
                <label className={styles.propertyLabel}>
                    Data Field:
                    <select
                        value={block.content || ''}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                    >
                        <option value="">Select a field</option>
                        {availableFields.map((field):JSX.Element => (
                            <option key={field} value={field}>{field}</option>
                        ))}
                    </select>
                </label>
            )}
            <label className={styles.propertyLabel}>
                Width:
                <select
                    value={block.grid_column_span}
                    onChange={(e) => onUpdate({ grid_column_span: Number(e.target.value) })}
                >
                    {[...Array(12)].map((_, i):JSX.Element => (
                        <option key={i} value={i + 1}>{i + 1} column(s)</option>
                    ))}
                </select>
            </label>
            <label className={styles.propertyLabel}>
                Height:
                <select
                    value={block.grid_row_span}
                    onChange={(e) => onUpdate({ grid_row_span: Number(e.target.value) })}
                >
                    {[...Array(10)].map((_, i):JSX.Element => (
                        <option key={i} value={i + 1}>{i + 1} row(s)</option>
                    ))}
                </select>
            </label>
            <label className={styles.propertyLabel}>
                Font Size:
                <input
                    type="number"
                    value={block.styles.fontSize?.replace('px', '') || ''}
                    onChange={(e) => onUpdate({ styles: { ...block.styles, fontSize: `${e.target.value}px` } })}
                />
            </label>
            <label className={styles.propertyLabel}>
                Color:
                <input
                    type="color"
                    value={block.styles.color || '#000000'}
                    onChange={(e) => onUpdate({ styles: { ...block.styles, color: e.target.value } })}
                />
            </label>
        </div>
    );
};

// export default PropertyEditorProps;