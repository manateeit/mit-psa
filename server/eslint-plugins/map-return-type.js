module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce return type annotation for map() callbacks',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.property &&
          node.callee.property.name === 'map' &&
          node.arguments.length > 0
        ) {
          const callback = node.arguments[0];
          if (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression') {
            if (!callback.returnType) {
              context.report({
                node: callback,
                message: 'Map callback should have an explicit return type annotation',
              });
            }
          }
        }
      },
    };
  },
};