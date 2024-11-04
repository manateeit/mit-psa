import { IResource, IPolicy, ICondition, IRole, IUserWithRoles } from '@/interfaces/auth.interfaces';
import { USER_ATTRIBUTES, UserAttributeKey } from '@/lib/attributes/EntityAttributes';
import { hasPermission } from '@/lib/auth/rbac';
import { Policy } from './abac';

export class PolicyEngine {
  private policies: Policy[] = [];

  addPolicy(policy: IPolicy) {
    this.policies.push(new Policy(
      policy.policy_id,
      policy.policy_name,
      policy.resource,
      policy.action,
      policy.conditions
    ));
  }

  removePolicy(policy: IPolicy) {
    this.policies = this.policies.filter(p => p.policy_id !== policy.policy_id);
  }

  evaluateAccess(user: IUserWithRoles, resource: IResource, action: string): boolean {
    // First, check RBAC permissions
    if (!hasPermission(user, resource.type, action)) {
      return false;
    }

    // If RBAC check passes, evaluate ABAC policies
    return this.policies
      .filter(policy => policy.resource === resource.type && policy.action === action)
      .every(policy => policy.evaluate(user, resource, action));
  }

  private evaluateCondition(condition: ICondition, user: IUserWithRoles, resource: IResource): boolean {
    const userValue = USER_ATTRIBUTES[condition.userAttribute as UserAttributeKey].getValue(user);
    const resourceValue = resource.attributes.get(condition.resourceAttribute as string);

    switch (condition.operator) {
      case '==':
        return userValue === resourceValue;
      case '!=':
        return userValue !== resourceValue;
      case '>':
        return userValue > resourceValue;
      case '<':
        return userValue < resourceValue;
      case '>=':
        return userValue >= resourceValue;
      case '<=':
        return userValue <= resourceValue;
      case 'contains':
        if (condition.userAttribute === 'roles') {
          return (userValue as IRole[]).some(role => role.role_name === resourceValue);
        }
        return Array.isArray(userValue) && userValue.includes(resourceValue);
      case 'not contains':
        if (condition.userAttribute === 'roles') {
          return !(userValue as IRole[]).some(role => role.role_name === resourceValue);
        }
        return Array.isArray(userValue) && !userValue.includes(resourceValue);
      default:
        return false;
    }
  }
}
