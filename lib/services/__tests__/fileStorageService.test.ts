import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileStorageService } from '../fileStorageService';
import { GeneratedFile } from '../../../types/shopify';

// Mock GraphQL client
vi.mock('../graphqlClient', () => ({
  ShopifyGraphQLClient: vi.fn(() => ({
    query: vi.fn(),
    mutate: vi.fn()
  }))
}));

describe('FileStorageService', () => {
  let fileStorageService: FileStorageService;
  let mockSession: { shop: string; accessToken: string };
  let mockFile: GeneratedFile;
  let mockGraphQLClient: any;

  beforeEach(() => {
    mockSession = {
      shop: 'test-shop.myshopify.com',
      accessToken: 'test-token'
    };

    fileStorageService = new FileStorageService(mockSession);
    mockGraphQLClient = (fileStorageService as any).graphqlClient;

    mockFile = {
      filename: 'test-order.pdf',
      buffer: Buffer.from('mock-pdf-content'),
      mimetype: 'application/pdf',
      size: 1024
    };

    // Reset all mocks
    vi.clearAllMocks();

    // Mock shop GID query
    mockGraphQLClient.query.mockImplementation((query: string) => {
      if (query.includes('shop { id }')) {
        return Promise.resolve({
          shop: { id: 'gid://shopify/Shop/123' }
        });
      }
      return Promise.resolve({});
    });
  });

  describe('storeFile', () => {
    it('should store file successfully', async () => {
      // Mock successful metafield creation
      mockGraphQLClient.mutate.mockResolvedValue({
        metafieldsSet: {
          metafields: [{
            id: 'gid://shopify/Metafield/456',
            namespace: 'order_printer_files',
            key: 'test-key',
            value: JSON.stringify({
              filename: mockFile.filename,
              size: mockFile.size,
              contentType: mockFile.mimetype,
              buffer: mockFile.buffer.toString('base64'),
              isPublic: false,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString()
            }),
            type: 'json_string',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }],
          userErrors: []
        }
      });

      const result = await fileStorageService.storeFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file?.filename).toBe(mockFile.filename);
      expect(result.file?.size).toBe(mockFile.size);
      expect(result.file?.contentType).toBe(mockFile.mimetype);
      expect(result.file?.downloadUrl).toMatch(/^\/api\/print\/download\/.+$/);
      expect(result.file?.expiresAt).toBeDefined();
    });

    it('should handle storage errors', async () => {
      // Mock GraphQL error
      mockGraphQLClient.mutate.mockResolvedValue({
        metafieldsSet: {
          metafields: [],
          userErrors: [{ field: 'value', message: 'Value is too large' }]
        }
      });

      const result = await fileStorageService.storeFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Value is too large');
    });

    it('should store file with custom options', async () => {
      mockGraphQLClient.mutate.mockResolvedValue({
        metafieldsSet: {
          metafields: [{
            id: 'gid://shopify/Metafield/456',
            namespace: 'order_printer_files',
            key: 'test-key',
            value: '{}',
            type: 'json_string',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }],
          userErrors: []
        }
      });

      const options = {
        expiresInHours: 48,
        isPublic: true,
        contentType: 'application/pdf'
      };

      const result = await fileStorageService.storeFile(mockFile, options);

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metafields: expect.arrayContaining([
            expect.objectContaining({
              namespace: 'order_printer_files',
              type: 'json_string'
            })
          ])
        })
      );
    });
  });

  describe('getFile', () => {
    it('should retrieve file successfully', async () => {
      const fileMetadata = {
        filename: mockFile.filename,
        size: mockFile.size,
        contentType: mockFile.mimetype,
        buffer: mockFile.buffer.toString('base64'),
        isPublic: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };

      mockGraphQLClient.query.mockResolvedValue({
        shop: {
          metafield: {
            id: 'gid://shopify/Metafield/456',
            namespace: 'order_printer_files',
            key: 'test-key',
            value: JSON.stringify(fileMetadata),
            type: 'json_string',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      });

      const result = await fileStorageService.getFile('test-key');

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file?.filename).toBe(mockFile.filename);
      expect(result.file?.size).toBe(mockFile.size);
    });

    it('should handle file not found', async () => {
      mockGraphQLClient.query.mockResolvedValue({
        shop: { metafield: null }
      });

      const result = await fileStorageService.getFile('non-existent-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should handle expired files', async () => {
      const expiredFileMetadata = {
        filename: mockFile.filename,
        size: mockFile.size,
        contentType: mockFile.mimetype,
        buffer: mockFile.buffer.toString('base64'),
        isPublic: false,
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
        createdAt: new Date().toISOString()
      };

      mockGraphQLClient.query.mockResolvedValue({
        shop: {
          metafield: {
            id: 'gid://shopify/Metafield/456',
            value: JSON.stringify(expiredFileMetadata)
          }
        }
      });

      // Mock delete operation
      mockGraphQLClient.mutate.mockResolvedValue({
        metafieldDelete: {
          deletedId: 'gid://shopify/Metafield/456',
          userErrors: []
        }
      });

      const result = await fileStorageService.getFile('expired-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File has expired');
    });
  });

  describe('getFileBuffer', () => {
    it('should retrieve file buffer successfully', async () => {
      const fileMetadata = {
        filename: mockFile.filename,
        size: mockFile.size,
        contentType: mockFile.mimetype,
        buffer: mockFile.buffer.toString('base64'),
        isPublic: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };

      mockGraphQLClient.query.mockResolvedValue({
        shop: {
          metafield: {
            value: JSON.stringify(fileMetadata)
          }
        }
      });

      const result = await fileStorageService.getFileBuffer('test-key');

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer?.toString()).toBe(mockFile.buffer.toString());
      expect(result.contentType).toBe(mockFile.mimetype);
      expect(result.filename).toBe(mockFile.filename);
    });

    it('should handle buffer retrieval errors', async () => {
      mockGraphQLClient.query.mockResolvedValue({
        shop: { metafield: null }
      });

      const result = await fileStorageService.getFileBuffer('non-existent-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      // Mock getting metafield ID
      mockGraphQLClient.query.mockResolvedValue({
        shop: {
          metafield: {
            id: 'gid://shopify/Metafield/456'
          }
        }
      });

      // Mock successful deletion
      mockGraphQLClient.mutate.mockResolvedValue({
        metafieldDelete: {
          deletedId: 'gid://shopify/Metafield/456',
          userErrors: []
        }
      });

      const result = await fileStorageService.deleteFile('test-key');

      expect(result.success).toBe(true);
    });

    it('should handle file not found during deletion', async () => {
      mockGraphQLClient.query.mockResolvedValue({
        shop: { metafield: null }
      });

      const result = await fileStorageService.deleteFile('non-existent-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should handle deletion errors', async () => {
      mockGraphQLClient.query.mockResolvedValue({
        shop: {
          metafield: {
            id: 'gid://shopify/Metafield/456'
          }
        }
      });

      mockGraphQLClient.mutate.mockResolvedValue({
        metafieldDelete: {
          deletedId: null,
          userErrors: [{ field: 'id', message: 'Metafield not found' }]
        }
      });

      const result = await fileStorageService.deleteFile('test-key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Metafield not found');
    });
  });

  describe('listFiles', () => {
    it('should list files successfully', async () => {
      const fileMetadata1 = {
        filename: 'file1.pdf',
        size: 1024,
        contentType: 'application/pdf',
        buffer: 'base64content1',
        isPublic: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };

      const fileMetadata2 = {
        filename: 'file2.pdf',
        size: 2048,
        contentType: 'application/pdf',
        buffer: 'base64content2',
        isPublic: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };

      mockGraphQLClient.query.mockResolvedValue({
        shop: {
          metafields: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/Metafield/456',
                  key: 'key1',
                  value: JSON.stringify(fileMetadata1)
                }
              },
              {
                node: {
                  id: 'gid://shopify/Metafield/457',
                  key: 'key2',
                  value: JSON.stringify(fileMetadata2)
                }
              }
            ]
          }
        }
      });

      const result = await fileStorageService.listFiles();

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.files?.[0].filename).toBe('file1.pdf');
      expect(result.files?.[1].filename).toBe('file2.pdf');
    });

    it('should filter out expired files during listing', async () => {
      const validFileMetadata = {
        filename: 'valid-file.pdf',
        size: 1024,
        contentType: 'application/pdf',
        buffer: 'base64content',
        isPublic: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };

      const expiredFileMetadata = {
        filename: 'expired-file.pdf',
        size: 1024,
        contentType: 'application/pdf',
        buffer: 'base64content',
        isPublic: false,
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
        createdAt: new Date().toISOString()
      };

      mockGraphQLClient.query.mockResolvedValue({
        shop: {
          metafields: {
            edges: [
              {
                node: {
                  id: 'gid://shopify/Metafield/456',
                  key: 'valid-key',
                  value: JSON.stringify(validFileMetadata)
                }
              },
              {
                node: {
                  id: 'gid://shopify/Metafield/457',
                  key: 'expired-key',
                  value: JSON.stringify(expiredFileMetadata)
                }
              }
            ]
          }
        }
      });

      const result = await fileStorageService.listFiles();

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files?.[0].filename).toBe('valid-file.pdf');
    });
  });

  describe('cleanupExpiredFiles', () => {
    it('should cleanup expired files successfully', async () => {
      const validFileMetadata = {
        filename: 'valid-file.pdf',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };

      const expiredFileMetadata = {
        filename: 'expired-file.pdf',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        createdAt: new Date().toISOString()
      };

      // Mock listFiles call
      vi.spyOn(fileStorageService, 'listFiles').mockResolvedValue({
        success: true,
        files: [
          {
            id: '456',
            url: '/api/print/download/valid-key',
            downloadUrl: '/api/print/download/valid-key',
            filename: 'valid-file.pdf',
            size: 1024,
            contentType: 'application/pdf',
            expiresAt: validFileMetadata.expiresAt,
            createdAt: validFileMetadata.createdAt
          },
          {
            id: '457',
            url: '/api/print/download/expired-key',
            downloadUrl: '/api/print/download/expired-key',
            filename: 'expired-file.pdf',
            size: 1024,
            contentType: 'application/pdf',
            expiresAt: expiredFileMetadata.expiresAt,
            createdAt: expiredFileMetadata.createdAt
          }
        ]
      });

      // Mock deleteFile call
      vi.spyOn(fileStorageService, 'deleteFile').mockResolvedValue({
        success: true
      });

      const result = await fileStorageService.cleanupExpiredFiles();

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
    });
  });
});