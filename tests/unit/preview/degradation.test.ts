import { describe, it, expect } from 'vitest';

// 直接导入要测试的函数
import {
  getFileExtension,
  getFileCategory,
} from '../../../src/lib/preview/degradation';

describe('PreviewServiceRouter - Utility Functions', () => {
  describe('getFileExtension', () => {
    it('应正确提取小写扩展名', () => {
      expect(getFileExtension('test.docx')).toBe('docx');
      expect(getFileExtension('file.pdf')).toBe('pdf');
      expect(getFileExtension('image.png')).toBe('png');
    });

    it('应正确提取大写扩展名并转为小写', () => {
      expect(getFileExtension('test.DOCX')).toBe('docx');
      expect(getFileExtension('FILE.PDF')).toBe('pdf');
    });

    it('应处理无扩展名文件', () => {
      expect(getFileExtension('noext')).toBe('');
      expect(getFileExtension('file.')).toBe('');
    });

    it('应处理多个点的文件名', () => {
      expect(getFileExtension('my.file.name.docx')).toBe('docx');
    });
  });

  describe('getFileCategory', () => {
    it('应正确识别图片类型', () => {
      expect(getFileCategory('image/png', 'png')).toBe('image');
      expect(getFileCategory('image/jpeg', 'jpg')).toBe('image');
    });

    it('应正确识别 PDF 类型', () => {
      expect(getFileCategory('application/pdf', 'pdf')).toBe('pdf');
    });

    it('应正确识别电子表格类型', () => {
      expect(getFileCategory('application/vnd.ms-excel', 'xlsx')).toBe('spreadsheet');
      expect(getFileCategory('text/csv', 'csv')).toBe('spreadsheet');
    });

    it('应正确识别演示文稿类型', () => {
      expect(getFileCategory('application/vnd.ms-powerpoint', 'pptx')).toBe('presentation');
    });

    it('应正确识别文档类型', () => {
      expect(getFileCategory('application/msword', 'doc')).toBe('document');
      expect(getFileCategory('application/vnd.oasis.opendocument.text', 'odt')).toBe('document');
    });

    it('其他类型应返回 other', () => {
      expect(getFileCategory('text/plain', 'txt')).toBe('other');
      expect(getFileCategory('application/zip', 'zip')).toBe('other');
    });
  });
});
