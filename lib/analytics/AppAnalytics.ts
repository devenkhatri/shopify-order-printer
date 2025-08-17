/**
 * Comprehensive analytics and monitoring system for Shopify Order Printer app
 * Tracks user behavior, app performance, and business metrics
 */

interface AnalyticsEvent {
    event: string;
    properties?: Record<string, any>;
    userId?: string;
    shop?: string;
    timestamp?: string;
}

interface UserProperties {
    shop: string;
    userId?: string;
    plan?: string;
    installDate?: string;
    lastActive?: string;
    totalOrders?: number;
    totalPrints?: number;
}

interface BusinessMetric {
    metric: string;
    value: number;
    shop: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

class AppAnalytics {
    private static instance: AppAnalytics;
    private isEnabled: boolean;
    private userId?: string;
    private shop?: string;
    private sessionId: string;

    private constructor() {
        this.isEnabled = process.env.NODE_ENV === 'production' &&
            !!process.env.ANALYTICS_ENABLED;
        this.sessionId = this.generateSessionId();
    }

    public static getInstance(): AppAnalytics {
        if (!AppAnalytics.instance) {
            AppAnalytics.instance = new AppAnalytics();
        }
        return AppAnalytics.instance;
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    public initialize(shop: string, userId?: string): void {
        this.shop = shop;
        this.userId = userId;

        if (this.isEnabled) {
            this.track('app_initialized', {
                shop,
                userId,
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
            });
        }
    }

    public track(event: string, properties?: Record<string, any>): void {
        if (!this.isEnabled) return;

        const analyticsEvent: AnalyticsEvent = {
            event,
            properties: {
                ...properties,
                sessionId: this.sessionId,
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
                url: typeof window !== 'undefined' ? window.location.href : undefined,
            },
            userId: this.userId,
            shop: this.shop,
            timestamp: new Date().toISOString(),
        };

        this.sendEvent(analyticsEvent);
    }

    public identify(userProperties: UserProperties): void {
        if (!this.isEnabled) return;

        this.shop = userProperties.shop;
        this.userId = userProperties.userId;

        this.sendIdentify(userProperties);
    }

    public page(pageName: string, properties?: Record<string, any>): void {
        if (!this.isEnabled) return;

        this.track('page_view', {
            page: pageName,
            ...properties,
        });
    }

    // Business-specific tracking methods

    public trackOrderView(orderId: string, orderValue: number, gstAmount: number): void {
        this.track('order_viewed', {
            orderId,
            orderValue,
            gstAmount,
            gstPercentage: (gstAmount / orderValue) * 100,
        });
    }

    public trackPrintGeneration(type: 'pdf' | 'csv', orderCount: number, success: boolean): void {
        this.track('print_generated', {
            type,
            orderCount,
            success,
            isBulk: orderCount > 1,
        });
    }

    public trackTemplateUsage(templateId: string, action: 'create' | 'edit' | 'delete' | 'use'): void {
        this.track('template_action', {
            templateId,
            action,
        });
    }

    public trackGSTCalculation(orderValue: number, gstRate: number, gstType: 'CGST_SGST' | 'IGST'): void {
        this.track('gst_calculated', {
            orderValue,
            gstRate,
            gstType,
            gstAmount: orderValue * gstRate,
        });
    }

    public trackBulkOperation(operation: 'pdf' | 'csv', orderCount: number, dateRange: { start: string; end: string }): void {
        this.track('bulk_operation', {
            operation,
            orderCount,
            dateRange,
            duration: new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime(),
        });
    }

    public trackError(error: Error, context?: Record<string, any>): void {
        this.track('error_occurred', {
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name,
            ...context,
        });
    }

    public trackPerformance(action: string, duration: number, success: boolean): void {
        this.track('performance_metric', {
            action,
            duration,
            success,
            isSlowOperation: duration > 5000,
        });
    }

    public trackFeatureUsage(feature: string, context?: Record<string, any>): void {
        this.track('feature_used', {
            feature,
            ...context,
        });
    }

    public trackUserEngagement(action: string, value?: number): void {
        this.track('user_engagement', {
            action,
            value,
            sessionDuration: Date.now() - parseInt(this.sessionId.split('_')[1]),
        });
    }

    // Business metrics tracking

    public recordBusinessMetric(metric: string, value: number, metadata?: Record<string, any>): void {
        if (!this.isEnabled || !this.shop) return;

        const businessMetric: BusinessMetric = {
            metric,
            value,
            shop: this.shop,
            timestamp: new Date().toISOString(),
            metadata,
        };

        this.sendBusinessMetric(businessMetric);
    }

    public trackRevenue(amount: number, currency: string = 'INR'): void {
        this.recordBusinessMetric('revenue', amount, { currency });
    }

    public trackOrderProcessed(orderValue: number, gstAmount: number): void {
        this.recordBusinessMetric('orders_processed', 1, { orderValue, gstAmount });
        this.recordBusinessMetric('order_value', orderValue);
        this.recordBusinessMetric('gst_collected', gstAmount);
    }

    public trackPrintVolume(count: number, type: 'pdf' | 'csv'): void {
        this.recordBusinessMetric('prints_generated', count, { type });
    }

    // Data sending methods

    private async sendEvent(event: AnalyticsEvent): Promise<void> {
        try {
            // Send to multiple analytics providers
            await Promise.allSettled([
                this.sendToCustomAnalytics(event),
                this.sendToGoogleAnalytics(event),
                this.sendToMixpanel(event),
            ]);
        } catch (error) {
            console.error('Failed to send analytics event:', error);
        }
    }

    private async sendIdentify(userProperties: UserProperties): Promise<void> {
        try {
            await Promise.allSettled([
                this.sendUserPropertiesToCustomAnalytics(userProperties),
                this.sendUserPropertiesToMixpanel(userProperties),
            ]);
        } catch (error) {
            console.error('Failed to send user identification:', error);
        }
    }

    private async sendBusinessMetric(metric: BusinessMetric): Promise<void> {
        try {
            if (process.env.BUSINESS_METRICS_ENDPOINT) {
                await fetch(process.env.BUSINESS_METRICS_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`,
                    },
                    body: JSON.stringify(metric),
                });
            }
        } catch (error) {
            console.error('Failed to send business metric:', error);
        }
    }

    private async sendToCustomAnalytics(event: AnalyticsEvent): Promise<void> {
        if (process.env.CUSTOM_ANALYTICS_ENDPOINT) {
            await fetch(process.env.CUSTOM_ANALYTICS_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`,
                },
                body: JSON.stringify(event),
            });
        }
    }

    private async sendToGoogleAnalytics(event: AnalyticsEvent): Promise<void> {
        if (typeof window !== 'undefined' && window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
            window.gtag('event', event.event, {
                custom_map: event.properties,
                user_id: event.userId,
                custom_parameter_shop: event.shop,
            });
        }
    }

    private async sendToMixpanel(event: AnalyticsEvent): Promise<void> {
        if (typeof window !== 'undefined' && window.mixpanel && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
            window.mixpanel.track(event.event, {
                ...event.properties,
                userId: event.userId,
                shop: event.shop,
                timestamp: event.timestamp,
            });
        }
    }

    private async sendUserPropertiesToCustomAnalytics(userProperties: UserProperties): Promise<void> {
        if (process.env.CUSTOM_ANALYTICS_ENDPOINT) {
            await fetch(`${process.env.CUSTOM_ANALYTICS_ENDPOINT}/identify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`,
                },
                body: JSON.stringify(userProperties),
            });
        }
    }

    private async sendUserPropertiesToMixpanel(userProperties: UserProperties): Promise<void> {
        if (typeof window !== 'undefined' && window.mixpanel) {
            window.mixpanel.people.set({
                $name: userProperties.shop,
                shop: userProperties.shop,
                plan: userProperties.plan,
                install_date: userProperties.installDate,
                total_orders: userProperties.totalOrders,
                total_prints: userProperties.totalPrints,
            });
        }
    }

    // Utility methods

    public flush(): Promise<void> {
        // Flush any pending analytics events
        return Promise.resolve();
    }

    public disable(): void {
        this.isEnabled = false;
    }

    public enable(): void {
        this.isEnabled = process.env.NODE_ENV === 'production';
    }

    public isAnalyticsEnabled(): boolean {
        return this.isEnabled;
    }
}

// Global analytics instance
export const analytics = AppAnalytics.getInstance();

// Convenience functions
export const trackEvent = (event: string, properties?: Record<string, any>) =>
    analytics.track(event, properties);

export const trackPage = (pageName: string, properties?: Record<string, any>) =>
    analytics.page(pageName, properties);

export const identifyUser = (userProperties: UserProperties) =>
    analytics.identify(userProperties);

export const trackError = (error: Error, context?: Record<string, any>) =>
    analytics.trackError(error, context);

// Declare global types for third-party analytics
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        mixpanel: {
            track: (event: string, properties?: Record<string, any>) => void;
            people: {
                set: (properties: Record<string, any>) => void;
            };
        };
    }
}

export type { AnalyticsEvent, UserProperties, BusinessMetric };