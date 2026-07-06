import { NetworkRepository } from '@/network';
import { BackendEnvelope, FeatureAccessDecision, FeatureAccessRequest, PaymentProviderKind, SubscriptionSnapshot, SubscriptionTier, UpgradeIntent } from '@/monetization/types';

export interface SubscriptionService {
  getSubscription(userId: string): Promise<SubscriptionSnapshot>;
  validateSubscription(userId: string): Promise<SubscriptionSnapshot>;
  checkFeatureAccess(request: FeatureAccessRequest): Promise<FeatureAccessDecision>;
  createUpgradeIntent(input: { userId: string; provider: PaymentProviderKind; targetTier: SubscriptionTier }): Promise<UpgradeIntent>;
}

export class BackendSubscriptionService implements SubscriptionService {
  constructor(private readonly networkRepository: NetworkRepository) {}

  async getSubscription(userId: string): Promise<SubscriptionSnapshot> {
    const response = await this.networkRepository.request<BackendEnvelope<SubscriptionSnapshot>>({
      method: 'GET',
      url: `/subscriptions/${encodeURIComponent(userId)}`,
      requiresAuth: true,
      timeoutMs: 8_000,
      metadata: { domain: 'subscription', operation: 'get' },
    });
    return this.unwrap(response.data);
  }

  async validateSubscription(userId: string): Promise<SubscriptionSnapshot> {
    const response = await this.networkRepository.request<BackendEnvelope<SubscriptionSnapshot>>({
      method: 'POST',
      url: `/subscriptions/${encodeURIComponent(userId)}/validate`,
      requiresAuth: true,
      timeoutMs: 10_000,
      metadata: { domain: 'subscription', operation: 'validate', dedupe: false },
    });
    return this.unwrap(response.data);
  }

  async checkFeatureAccess(request: FeatureAccessRequest): Promise<FeatureAccessDecision> {
    const response = await this.networkRepository.request<BackendEnvelope<FeatureAccessDecision>>({
      method: 'POST',
      url: '/subscriptions/access/check',
      body: request,
      requiresAuth: true,
      timeoutMs: 8_000,
      metadata: { domain: 'subscription', operation: 'feature-access' },
    });
    return this.unwrap(response.data);
  }

  async createUpgradeIntent(input: { userId: string; provider: PaymentProviderKind; targetTier: SubscriptionTier }): Promise<UpgradeIntent> {
    const response = await this.networkRepository.request<BackendEnvelope<UpgradeIntent>>({
      method: 'POST',
      url: '/subscriptions/upgrade-intents',
      body: input,
      requiresAuth: true,
      timeoutMs: 12_000,
      metadata: { domain: 'subscription', operation: 'upgrade-intent', dedupe: false },
    });
    return this.unwrap(response.data);
  }

  private unwrap<T>(envelope: BackendEnvelope<T>): T {
    if (!envelope?.success || !envelope.data) throw new Error(envelope?.error?.message ?? 'Backend request failed');
    return envelope.data;
  }
}
