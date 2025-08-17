import { Session } from '@shopify/shopify-api';
import { ShopifyOrder, OrderWithGST } from '../../types/shopify';
import { GSTService } from './gstService';
import { orderGraphQLService } from './orderGraphQLService';

/**
 * Service for managing orders with GST calculations
 */
export class OrderService {
  private gstService: GSTService;

  constructor(storeState: string = 'MH') {
    this.gstService = new GSTService(storeState);
  }

  /**
   * Set the store state for GST calculations
   */
  setStoreState(state: string): void {
    this.gstService.setStoreState(state);
  }

  /**
   * Get orders with GST breakdown
   */
  async getOrdersWithGST(
    session: Session,
    options: {
      limit?: number;
      cursor?: string | null;
      status?: string | null;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ): Promise<{ orders: OrderWithGST[]; hasNextPage: boolean; cursor?: string }> {
    try {
      // Fetch orders from Shopify using GraphQL service
      const ordersResponse = await orderGraphQLService.getOrders(session, {
        first: options.limit || 50,
        after: options.cursor || undefined,
        query: this.buildOrderQuery(options)
      });

      // Add GST breakdown to each order
      const ordersWithGST = await this.gstService.addGSTToOrders(ordersResponse.orders);

      return {
        orders: ordersWithGST,
        hasNextPage: ordersResponse.hasNextPage,
        cursor: ordersResponse.cursor
      };
    } catch (error) {
      console.error('Failed to fetch orders with GST:', error);
      throw new Error(`Failed to fetch orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single order by ID with GST breakdown
   */
  async getOrderById(session: Session, orderId: string): Promise<OrderWithGST | null> {
    try {
      const order = await orderGraphQLService.getOrderById(session, orderId);
      
      if (!order) {
        return null;
      }

      return await this.gstService.addGSTToOrder(order);
    } catch (error) {
      console.error(`Failed to fetch order ${orderId} with GST:`, error);
      throw new Error(`Failed to fetch order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get orders for bulk operations with GST summary
   */
  async getOrdersForBulkPrint(
    session: Session,
    options: {
      dateFrom: Date;
      dateTo: Date;
      orderIds?: string[];
      includeGSTSummary?: boolean;
    }
  ): Promise<{
    orders: OrderWithGST[];
    gstSummary?: any;
  }> {
    try {
      let orders: ShopifyOrder[];

      if (options.orderIds && options.orderIds.length > 0) {
        // Fetch specific orders by IDs
        orders = await Promise.all(
          options.orderIds.map(async (id) => {
            const order = await orderGraphQLService.getOrderById(session, id);
            return order;
          })
        ).then(results => results.filter(Boolean) as ShopifyOrder[]);
      } else {
        // Fetch orders by date range
        const query = `created_at:>='${options.dateFrom.toISOString()}' AND created_at:<='${options.dateTo.toISOString()}'`;
        const ordersResponse = await orderGraphQLService.getOrders(session, {
          first: 250, // Maximum for bulk operations
          query
        });
        orders = ordersResponse.orders;
      }

      // Add GST breakdown to orders
      const ordersWithGST = await this.gstService.addGSTToOrders(orders);

      // Generate GST summary if requested
      let gstSummary;
      if (options.includeGSTSummary) {
        gstSummary = await this.gstService.createGSTSummary(orders);
      }

      return {
        orders: ordersWithGST,
        gstSummary
      };
    } catch (error) {
      console.error('Failed to fetch orders for bulk print:', error);
      throw new Error(`Failed to fetch orders for bulk print: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate GST breakdown for line items in an order
   */
  async getOrderLineItemsWithGST(session: Session, orderId: string): Promise<{
    order: OrderWithGST;
    lineItems: Array<{
      lineItem: any;
      gstBreakdown: any;
      tshirtDetails: any;
    }>;
    orderTotal: any;
  }> {
    try {
      const order = await orderGraphQLService.getOrderById(session, orderId);
      
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      const lineItemsWithGST = await this.gstService.calculateLineItemGST(order);
      const orderWithGST = await this.gstService.addGSTToOrder(order);

      return {
        order: orderWithGST,
        lineItems: lineItemsWithGST.lineItems,
        orderTotal: lineItemsWithGST.orderTotal
      };
    } catch (error) {
      console.error(`Failed to get line items with GST for order ${orderId}:`, error);
      throw new Error(`Failed to get line items with GST: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate orders for GST calculation
   */
  async validateOrdersForGST(orders: ShopifyOrder[]): Promise<{
    validOrders: ShopifyOrder[];
    invalidOrders: Array<{ order: ShopifyOrder; errors: string[] }>;
  }> {
    const validOrders: ShopifyOrder[] = [];
    const invalidOrders: Array<{ order: ShopifyOrder; errors: string[] }> = [];

    for (const order of orders) {
      const validation = this.gstService.validateOrderForGST(order);
      
      if (validation.isValid) {
        validOrders.push(order);
      } else {
        invalidOrders.push({
          order,
          errors: validation.errors
        });
      }
    }

    return {
      validOrders,
      invalidOrders
    };
  }

  /**
   * Build GraphQL query string for order filtering
   */
  private buildOrderQuery(options: {
    status?: string | null;
    dateFrom?: Date;
    dateTo?: Date;
  }): string {
    const queryParts: string[] = [];

    if (options.status) {
      queryParts.push(`financial_status:${options.status}`);
    }

    if (options.dateFrom) {
      queryParts.push(`created_at:>='${options.dateFrom.toISOString()}'`);
    }

    if (options.dateTo) {
      queryParts.push(`created_at:<='${options.dateTo.toISOString()}'`);
    }

    return queryParts.join(' AND ');
  }

  /**
   * Get GST service instance for advanced operations
   */
  getGSTService(): GSTService {
    return this.gstService;
  }
}

// Export a default instance
export const orderService = new OrderService();

// Legacy exports for backward compatibility
export async function getOrdersWithGST(
  session: Session,
  options: {
    limit?: number;
    cursor?: string | null;
    status?: string | null;
  }
): Promise<{ orders: OrderWithGST[]; hasNextPage: boolean; cursor?: string }> {
  return orderService.getOrdersWithGST(session, options);
}

export async function getOrderById(session: Session, orderId: string): Promise<OrderWithGST | null> {
  return orderService.getOrderById(session, orderId);
}