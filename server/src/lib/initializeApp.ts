import { isEnterprise } from '@/lib/features';
import { parsePolicy } from '@/lib/auth/ee';

export async function initializeApp() {
  if (isEnterprise) {
    const { PolicyEngine } = await import('@ee/lib/auth');
    const policyEngine = new PolicyEngine();

    const policies = [
      `ALLOW read ON Ticket`,
      `ALLOW write ON Ticket`,
      // Add more policies as needed
    ];

    for (const policyString of policies) {
      const policy = await parsePolicy(policyString);
      policyEngine.addPolicy(policy);
    }

    return policyEngine;
  }

  // Community Edition uses basic RBAC only
  return null;
}
