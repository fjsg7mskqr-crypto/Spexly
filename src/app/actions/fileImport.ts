'use server';

import mammoth from 'mammoth';
import { createClient } from '@/lib/supabase/server';
import { AuthenticationError, logError } from '@/lib/errors';

// pdf-parse is CommonJS, use dynamic import
const parsePdf = async (buffer: Buffer) => {
  type PdfParseResult = { text: string };
  type PdfParseFn = (dataBuffer: Buffer) => Promise<PdfParseResult>;

  const pdfParseModule = await import('pdf-parse');
  const parser = pdfParseModule as unknown as PdfParseFn;

  return parser(buffer);
};

/**
 * Parse uploaded file and extract text content.
 * Supports: PDF (.pdf), Word (.docx), Text (.txt, .md)
 */
export async function parseUploadedFile(fileData: string, fileName: string): Promise<{
  success: boolean;
  content?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError('You must be logged in to upload files.');
    }

    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    // Convert base64 data URL to buffer
    const base64Data = fileData.split(',')[1] || fileData;
    const buffer = Buffer.from(base64Data, 'base64');

    let content = '';

    switch (fileExtension) {
      case 'pdf':
        // Parse PDF
        const pdfData = await parsePdf(buffer);
        content = pdfData.text;
        break;

      case 'docx':
        // Parse Word document
        const docxResult = await mammoth.extractRawText({ buffer });
        content = docxResult.value;
        break;

      case 'txt':
      case 'md':
      case 'markdown':
        // Plain text
        content = buffer.toString('utf-8');
        break;

      default:
        return {
          success: false,
          error: `Unsupported file type: ${fileExtension}. Please upload PDF, DOCX, TXT, or MD files.`,
        };
    }

    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: 'File appears to be empty or could not be parsed.',
      };
    }

    return {
      success: true,
      content: content.trim(),
    };
  } catch (error) {
    logError(error, { action: 'parseUploadedFile', fileName });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse file',
    };
  }
}
