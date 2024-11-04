// server/src/components/TemplateRenderer.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Calculation, Conditional, Field, List, IInvoiceTemplate, Section, Style, TemplateElement, IInvoice, StaticText, InvoiceViewModel, GlobalCalculation } from '@/interfaces/invoice.interfaces';
import renderstyles from './TemplateRenderer.module.css'

interface TemplateRendererProps {
    template: IInvoiceTemplate;
    invoiceData: InvoiceViewModel;
}

const TemplateRenderer: React.FC<TemplateRendererProps> = ({ template, invoiceData }) => {
    const [globalValues, setGlobalValues] = useState<Record<string, number>>({});

    useEffect(() => {
        console.log('Parsed template:', template.parsed);
        console.log('Invoice data:', invoiceData);

        const calculatedGlobals: Record<string, number> = {};
        template.parsed.globals.forEach(global => {
            if (global.type === 'calculation') {
                const result = calculateGlobal(global, invoiceData);
                calculatedGlobals[global.name] = result;
            }
        });
        setGlobalValues(calculatedGlobals);
    }, [template.parsed.globals, invoiceData]);

    const calculateGlobal = (global: GlobalCalculation, data: InvoiceViewModel): number => {
        const { expression } = global;
        const fieldData = data[expression.field as keyof InvoiceViewModel];

        if (Array.isArray(fieldData)) {
            switch (expression.operation) {
                case 'sum':
                    return fieldData.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
                case 'count':
                    return fieldData.length;
                default:
                    return 0;
            }
        }
        return 0;
    };

    const styles = useMemo(() => {
        return template.parsed.sections.flatMap((section: Section) =>
            section.content.filter((item): item is Style => item.type === 'style')
        );
    }, [template]);

    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.textContent = styles.map(createStyleString).join('\n');
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
    }, [styles]);

    const renderSection = (section: Section) => {
        const contentRows = calculateContentRows(section.content);
        const actualRows = Math.max(section.grid.minRows, contentRows);

        return (
            <div
                key={section.type}
                className={renderstyles.gridSection}
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${section.grid.columns}, 1fr)`,
                    gridTemplateRows: `repeat(${actualRows}, minmax(12px, auto))`,
                    gap: '8px',
                }}
            >
                {section.content.map((item: any, index: number):JSX.Element => renderItem(item, index))}
                {[...Array(actualRows - contentRows)].map((_, index):JSX.Element => (
                    <div
                        key={`empty-row-${index}`}
                        style={{
                            gridColumn: '1 / -1',
                            height: '12px',
                        }}
                    />
                ))}
            </div>
        );
    };

    const calculateContentRows = (content: TemplateElement[]): number => {
        return content.reduce((maxRow, item) => {
            let itemEndRow = 1; // Default to 1 if no position is specified

            if ('position' in item && item.position) {
                itemEndRow = item.position.row + (item.span?.rowSpan || 1);
            } else if (item.type === 'list') {
                itemEndRow = calculateListRows(item);
            }

            return Math.max(maxRow, itemEndRow);
        }, 0);
    };



    const calculateListRows = (list: List): number => {
        // This is a simplified calculation. You might need to adjust this
        // based on how you want to handle list layouts
        return list.content.reduce((total, item) => {
            if ('position' in item && item.position) {
                return total + (item.span?.rowSpan || 1);
            }
            return total + 1; // Default to 1 row for items without position
        }, 0);
    };

    // const renderGroup = (group: Group, index: number) => {
    //     const groupData = invoiceData[group.groupBy as keyof IInvoice];

    //     if (!groupData || !Array.isArray(groupData)) {
    //         return <div key={index}>No data for group: {group.name}</div>;
    //     }

    //     // If no aggregation is specified, render as a list
    //     if (!group.aggregation) {
    //         return renderList(groupData, group.name, index);
    //     }

    //     // If aggregation is specified, render as a group with aggregation
    //     return renderAggregatedGroup(groupData, group, index);
    // };


    // const renderAggregatedGroup = (items: any[], group: Group, index: number) => {
    //     let aggregatedValue;
    //     switch (group.aggregation) {
    //         case 'sum':
    //             aggregatedValue = items.reduce((sum, item) => sum + (item[group.aggregationField || 0]), 0);
    //             break;
    //         case 'count':
    //             aggregatedValue = items.length;
    //             break;
    //         // Add more aggregation types as needed
    //     }

    //     return (
    //         <div key={index} className={`group-${group.name}`}>
    //             <h4>{group.name}</h4>
    //             <p>{group.aggregation} of {group.aggregationField}: {aggregatedValue}</p>
    //             {group.showDetails && renderList(items, `${group.name}-details`, index)}
    //         </div>
    //     );
    // };

    const renderItem = (item: TemplateElement, index: number) : JSX.Element => {
        try {
            switch (item.type) {
                case 'field':
                    return renderField(item, index);
                case 'list':
                    return renderList(item, index);
                case 'conditional':
                    return renderConditional(item, index);
                case 'staticText':
                    return renderStaticText(item, index);
                default:
                    return <></>;
            }
        }
        catch (e) {
            console.log(e);
            return <></>;
        }
    };

    const renderStaticText = (staticText: StaticText, index: number) => {
        const textStyles = (staticText.id && staticText.id !== undefined)
            ? styles.find(style =>
                style.elements.includes(`text:${staticText.id}`) || style.elements.includes('' + staticText.id)
            )
            : undefined;

        // Default position and span if not provided
        const defaultPosition = { column: 1, row: 1 };
        const defaultSpan = { columnSpan: 1, rowSpan: 1 };

        return (
            <div
                key={index}
                style={{
                    gridColumn: `${staticText.position?.column || defaultPosition.column} / span ${staticText.span?.columnSpan || defaultSpan.columnSpan}`,
                    gridRow: `${staticText.position?.row || defaultPosition.row} / span ${staticText.span?.rowSpan || defaultSpan.rowSpan}`,
                    ...textStyles?.props,
                }}
            >
                {staticText.content}
            </div>
        );
    };


    const renderField = (field: Field, index: number) => {
        let value;
        if (field.name in globalValues) {
            value = globalValues[field.name];
        } else {
            value = field.name.split('.').reduce((obj: any, key: string) => {
                return obj && typeof obj === 'object' ? obj[key as keyof typeof obj] : undefined;
            }, invoiceData as any);
        }

        return (
            <div
                key={index}
                style={{
                    gridColumn: `${field.position?.column || 1} / span ${field.span?.columnSpan || 1}`,
                    gridRow: `${field.position?.row || 1} / span ${field.span?.rowSpan || 1}`,
                }}
            >
                {renderValue(value)}
            </div>
        );
    };

    const renderList = (list: List, index: number) => {
        const listData = invoiceData[list.name as keyof InvoiceViewModel];

        if (!Array.isArray(listData)) {
            return <div key={index}>No data for list: {list.name}</div>;
        }

        return (
            <div
                key={index}
                className={`${renderstyles.listInvoiceItems} list-${list.name}`}
                style={{
                    gridColumn: '1 / -1',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: '8px',
                }}
            >
                {listData.map((item, itemIndex):JSX.Element => (
                    <React.Fragment key={itemIndex}>
                        {list.content.map((element, elementIndex):JSX.Element =>
                            renderListItem(element, item, `${itemIndex}-${elementIndex}`)
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderSimpleList = (items: any[], list: List) => {
        return (
            <>
                {items.map((item, itemIndex):JSX.Element => (
                    <div key={itemIndex} className={renderstyles.listItem}>
                        {list.content.map((element, elementIndex):JSX.Element =>
                            renderListItem(element, item, `${itemIndex}-${elementIndex}`)
                        )}
                    </div>
                ))}
            </>
        );
    };

    // const renderGroupedList = (items: any[], list: List) => {
    //     const groupedItems = items.reduce<Record<string, any[]>>((acc, item) => {
    //         const groupKey = item[list.groupBy as keyof typeof item] as string;
    //         if (!acc[groupKey]) {
    //             acc[groupKey] = [];
    //         }
    //         acc[groupKey].push(item);
    //         return acc;
    //     }, {});

    //     return (
    //         <>
    //             {Object.entries(groupedItems).map(([groupName, groupItems], groupIndex):JSX.Element => (
    //                 <div key={groupIndex} className="list-group">
    //                     <h4>{groupName}</h4>
    //                     {renderSimpleList(groupItems, list)}
    //                 </div>
    //             ))}
    //         </>
    //     );
    // };

    const renderListItem = (element: TemplateElement, item: any, key: string):JSX.Element => {
        switch (element.type) {
            case 'field':
                return (
                    <div
                        key={key}
                        className={renderstyles.listItem}
                        style={{
                            gridColumn: `${element.position?.column || 1} / span ${element.span?.columnSpan || 1}`,
                            gridRow: 'auto',
                        }}
                    >
                        {renderValue(item[element.name])}
                    </div>
                );
            // case 'calculation':
            //   return (
            //     <div
            //       key={key}
            //       className={renderstyles.listItem}
            //       style={{
            //         gridColumn: `${element.position.column} / span ${element.span?.columnSpan || 1}`,
            //         gridRow: 'auto',
            //       }}
            //     >
            //       {renderListCalculation(element, item, key)}
            //     </div>
            //   );
            // case 'conditional':
            //   return (
            //     <div
            //       key={key}
            //       className={renderstyles.listItem}
            //       style={{
            //         gridColumn: `${element.position.column} / span ${element.span?.columnSpan || 1}`,
            //         gridRow: 'auto',
            //       }}
            //     >
            //       {renderListConditional(element, item, key)}
            //     </div>
            //   );
            // case 'list':
            //   // Nested lists are not typically used within list items,
            //   // but if needed, you can implement it here
            //   console.warn('Nested lists are not supported in list items');
            //   return null;
            default:
                console.warn(`Unsupported element type in list item: ${(element as any).type}`);
                return <></>;
        }
    };

    const renderListField = (field: Field, item: any, key: string) => {
        const value = item[field.name];
        return (
            <div
                key={key}
                className={`list-field-${field.name}`}
                style={{
                    gridColumn: `${field.position?.column || 1} / span ${field.span?.columnSpan || 1}`,
                    gridRow: `${field.position?.row || 1} / span ${field.span?.rowSpan || 1}`,
                }}
            >
                {renderValue(value)}
            </div>
        );
    };

    const renderListCalculation = (calculation: Calculation, item: any, key: string) => {
        // Implement list-specific calculation logic here
        return (
            <div key={key} className={`list-calculation-${calculation.name}`}>
                {calculation.name}: {/* Add calculation result here */}
            </div>
        );
    };

    const renderListConditional = (conditional: Conditional, item: any, key: string) => {
        const { condition, content } = conditional;
        const fieldValue = item[condition.field];

        let shouldRender = false;

        switch (condition.op) {
            case '==':
                shouldRender = fieldValue == condition.value;
                break;
            case '!=':
                shouldRender = fieldValue != condition.value;
                break;
            case '>':
                shouldRender = fieldValue > condition.value;
                break;
            case '<':
                shouldRender = fieldValue < condition.value;
                break;
            case '>=':
                shouldRender = fieldValue >= condition.value;
                break;
            case '<=':
                shouldRender = fieldValue <= condition.value;
                break;
        }

        if (shouldRender) {
            return (
                <div key={key} className="list-conditional">
                    {content.map((contentItem, contentIndex):JSX.Element =>
                        renderListItem(contentItem, item, `${key}-${contentIndex}`)
                    )}
                </div>
            );
        }

        return null;
    };

    const renderValue = (value: unknown): React.ReactNode => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        if (value === null || value === undefined) {
            return 'N/A';
        }
        if (value instanceof Date) {
            return value.toLocaleDateString(); // or any other date format you prefer
        }
        if (Array.isArray(value)) {
            return `[${value.map((v): string => {
                if (v instanceof Date) {
                    return v.toLocaleDateString(); // or any other date format you prefer
                }
                const renderedValue = renderValue(v);
                return typeof renderedValue === 'string' ? renderedValue : String(renderedValue);
            }).join(', ')}]`;
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return 'Unknown value';
    };

    // const renderCalculation = (calculation: Calculation, index: number) => {
    //     const listData = calculation.listReference 
    //       ? invoiceData[calculation.listReference as keyof InvoiceViewModel]
    //       : invoiceData[calculation.expression.field as keyof InvoiceViewModel];
      
    //     let result;
    //     if (Array.isArray(listData)) {
    //       switch (calculation.expression.operation) {
    //         case 'sum':
    //           result = listData.reduce((sum, item) => sum + (Number(item[calculation.expression.field]) || 0), 0);
    //           break;
    //         case 'count':
    //           result = listData.length;
    //           break;
    //         case 'avg':
    //           result = listData.reduce((sum, item) => sum + (Number(item[calculation.expression.field]) || 0), 0) / listData.length;
    //           break;
    //         default:
    //           result = 'N/A';
    //       }
    //     } else {
    //       result = 'N/A';
    //     }
    //     return (
    //       <div key={index}>
    //         {calculation.name}: {result}
    //       </div>
    //     );
    //   };

    const createStyleString = (style: Style): string => {
        const selector = style.elements.join(', ');
        const properties = Object.entries(style.props)
            .map(([key, value]):string => `${key}: ${value};`)
            .join(' ');

        return `${selector} { ${properties} }`;
    };

    const renderConditional = (conditional: Conditional, index: number): JSX.Element => {
        const { condition, content } = conditional;
        const fieldValue = invoiceData[condition.field as keyof InvoiceViewModel];
        if (fieldValue === undefined)
            return <></>;

        let shouldRender = false;

        switch (condition.op) {
            case '==':
                shouldRender = fieldValue == condition.value;
                break;
            case '!=':
                shouldRender = fieldValue != condition.value;
                break;
            case '>':
                shouldRender = fieldValue > condition.value;
                break;
            case '<':
                shouldRender = fieldValue < condition.value;
                break;
            case '>=':
                shouldRender = fieldValue >= condition.value;
                break;
            case '<=':
                shouldRender = fieldValue <= condition.value;
                break;
        }

        return shouldRender ? (
            <div key={index}>
                {content.map((item, contentIndex):JSX.Element => renderItem(item, contentIndex))}
            </div>
        ) : <></>;
    };

    return (
        <div className={renderstyles.invoiceTemplate}>
            {template.parsed.sections.map((section: Section, index: number):JSX.Element => (
                <React.Fragment key={index}>
                    {renderSection(section)}
                </React.Fragment>
            ))}
        </div>
    );
};

export default TemplateRenderer;
