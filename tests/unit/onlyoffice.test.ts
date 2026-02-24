import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('ONLYOFFICE_API_URL', 'http://localhost:8080');
vi.stubEnv('ONLYOFFICE_MOCK_MODE', 'true');
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

const {
  generateDocumentKey,
  getFileType,
  isSupportedFileType,
  buildDocumentConfig,
  isOnlyOfficeAvailable,
} = await import('@/lib/preview/onlyoffice');

describe('OnlyOffice Preview Module', () => {
  describe('generateDocumentKey', () => {
    it('should generate a consistent hash for same file ID and version', () => {
      const key1 = generateDocumentKey('file-123', 1);
      const key2 = generateDocumentKey('file-123', 1);
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different versions', () => {
      const key1 = generateDocumentKey('file-123', 1);
      const key2 = generateDocumentKey('file-123', 2);
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different files', () => {
      const key1 = generateDocumentKey('file-123', 1);
      const key2 = generateDocumentKey('file-456', 1);
      expect(key1).not.toBe(key2);
    });

    it('should generate 64 character hex strings', () => {
      const key = generateDocumentKey('file-123', 1);
      expect(key).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(key)).toBe(true);
    });
  });

  describe('getFileType', () => {
    it('should return correct file type for docx', () => {
      expect(getFileType('document.docx')).toBe('docx');
    });

    it('should return correct file type for xlsx', () => {
      expect(getFileType('spreadsheet.xlsx')).toBe('xlsx');
    });

    it('should return correct file type for pptx', () => {
      expect(getFileType('presentation.pptx')).toBe('pptx');
    });

    it('should return empty string for unknown types', () => {
      expect(getFileType('unknown.xyz')).toBe('');
    });

    it('should handle uppercase extensions', () => {
      expect(getFileType('document.DOCX')).toBe('docx');
    });

    it('should handle mixed case extensions', () => {
      expect(getFileType('document.DocX')).toBe('docx');
    });
  });

  describe('isSupportedFileType', () => {
    it('should return true for supported document types', () => {
      expect(isSupportedFileType('document.docx')).toBe(true);
      expect(isSupportedFileType('document.doc')).toBe(true);
      expect(isSupportedFileType('document.odt')).toBe(true);
      expect(isSupportedFileType('document.pdf')).toBe(true);
    });

    it('should return true for supported spreadsheet types', () => {
      expect(isSupportedFileType('sheet.xlsx')).toBe(true);
      expect(isSupportedFileType('sheet.xls')).toBe(true);
      expect(isSupportedFileType('sheet.ods')).toBe(true);
      expect(isSupportedFileType('sheet.csv')).toBe(true);
    });

    it('should return true for supported presentation types', () => {
      expect(isSupportedFileType('presentation.pptx')).toBe(true);
      expect(isSupportedFileType('presentation.ppt')).toBe(true);
      expect(isSupportedFileType('presentation.odp')).toBe(true);
    });

    it('should return false for unsupported types', () => {
      expect(isSupportedFileType('image.jpg')).toBe(false);
      expect(isSupportedFileType('archive.zip')).toBe(false);
      expect(isSupportedFileType('code.js')).toBe(false);
      expect(isSupportedFileType('video.mp4')).toBe(false);
    });
  });

  describe('buildDocumentConfig', () => {
    it('should build config with edit mode', () => {
      const config = {
        apiUrl: 'http://localhost:8080',
        apiKey: 'secret',
        documentKey: 'abc123',
        fileUrl: 'http://localhost:3000/api/v1/files/file-123',
        fileType: 'docx',
        mode: 'edit' as const,
        user: {
          id: 'user-1',
          name: 'Test User',
        },
      };

      const docConfig = buildDocumentConfig(config);

      expect(docConfig.document).toBeDefined();
      expect(docConfig.document.fileType).toBe('docx');
      expect(docConfig.document.key).toBe('abc123');
      expect(docConfig.document.url).toBe(config.fileUrl);
      expect(docConfig.document.permissions?.edit).toBe(true);
      expect(docConfig.document.permissions?.comment).toBe(true);

      expect(docConfig.editorConfig).toBeDefined();
      expect(docConfig.editorConfig.mode).toBe('edit');
      expect(docConfig.editorConfig.user.id).toBe('user-1');
      expect(docConfig.editorConfig.callbackUrl).toBeDefined();
    });

    it('should build config with view mode', () => {
      const config = {
        apiUrl: 'http://localhost:8080',
        apiKey: 'secret',
        documentKey: 'abc123',
        fileUrl: 'http://localhost:3000/api/v1/files/file-123',
        fileType: 'docx',
        mode: 'view' as const,
        user: {
          id: 'user-1',
          name: 'Test User',
        },
      };

      const docConfig = buildDocumentConfig(config);

      expect(docConfig.editorConfig.mode).toBe('view');
      expect(docConfig.document.permissions?.edit).toBe(false);
      expect(docConfig.document.permissions?.comment).toBe(false);
    });

    it('should not include callbackUrl in view mode', () => {
      const config = {
        apiUrl: 'http://localhost:8080',
        apiKey: 'secret',
        documentKey: 'abc123',
        fileUrl: 'http://localhost:3000/api/v1/files/file-123',
        fileType: 'docx',
        mode: 'view' as const,
        user: {
          id: 'user-1',
          name: 'Test User',
        },
      };

      const docConfig = buildDocumentConfig(config);
      expect(docConfig.editorConfig.callbackUrl).toBeUndefined();
    });
  });

  describe('isOnlyOfficeAvailable', () => {
    it('should return true when ONLYOFFICE_API_URL is set', () => {
      vi.stubEnv('ONLYOFFICE_API_URL', 'http://localhost:8080');
      vi.stubEnv('ONLYOFFICE_MOCK_MODE', 'false');
      expect(isOnlyOfficeAvailable()).toBe(true);
    });

    it('should return true when ONLYOFFICE_MOCK_MODE is true', () => {
      vi.stubEnv('ONLYOFFICE_API_URL', '');
      vi.stubEnv('ONLYOFFICE_MOCK_MODE', 'true');
      expect(isOnlyOfficeAvailable()).toBe(true);
    });

    it('should return false when neither URL nor mock mode is set', () => {
      vi.stubEnv('ONLYOFFICE_API_URL', '');
      vi.stubEnv('ONLYOFFICE_MOCK_MODE', 'false');
      expect(isOnlyOfficeAvailable()).toBe(false);
    });
  });
});
