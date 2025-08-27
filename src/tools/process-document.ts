import { z } from 'zod';
import axios from 'axios';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageIndexMcpClient } from '../client/mcp-client.js';
import fs from 'fs/promises';
import path from 'path';
import { createErrorResponse } from '../result.js';
import { ToolDefinition } from './types.js';

// Schema for process document parameters - accepts both URLs and local file paths
export const processDocumentSchema = z.object({
  url: z.string().describe('URL to a PDF document or local file path'),
});

export type ProcessDocumentParams = z.infer<typeof processDocumentSchema>;

interface FileInfo {
  name: string;
  size: number;
  mimeType: string;
  buffer: Buffer;
}

/**
 * Simplified process_document tool that handles only PDF files
 * Supports both URLs and local file paths with inline file handling
 */
export async function processDocument(
  params: ProcessDocumentParams,
  mcpClient: PageIndexMcpClient,
): Promise<CallToolResult> {
  const { url: rawUrl } = params;
  const url = rawUrl.trim();

  try {
    const isLocal = !url.startsWith('http://') && !url.startsWith('https://');
    let fileInfo: FileInfo = isLocal ? await readLocalPdf(url) : await downloadPdf(url);

    const signedUrlResult = await mcpClient.callTool('get_signed_upload_url', {
      fileName: fileInfo.name,
      fileType: fileInfo.mimeType,
    });
    if (!signedUrlResult.content?.[0]?.text) {
      throw new Error('Failed to get signed upload URL from remote server');
    }

    const uploadInfo = JSON.parse(signedUrlResult.content[0].text as string);
    if (!uploadInfo.upload_url) {
      throw new Error('No upload URL received from server');
    }

    const uploadResponse = await axios.put(uploadInfo.upload_url, fileInfo.buffer, {
      headers: {
        'Content-Type': fileInfo.mimeType,
      },
      timeout: 60000,
    });
    if (uploadResponse.status !== 200) {
      throw new Error(`File upload failed with status ${uploadResponse.status}`);
    }

    const submitResult = await mcpClient.callTool('submit_document', {
      file_name: uploadInfo.file_name,
    });
    return submitResult;
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error occurred',
      {},
      {
        next_steps: {
          immediate: 'PDF processing failed. Please check the file/URL and try again.',
          options: [
            'Ensure the file is a valid PDF',
            'Check file size is under 100MB',
            'Verify the URL is accessible (for remote files)',
            'Try with a different PDF document',
          ],
          auto_retry: 'You can retry with the same document, or try a different one',
        },
      },
    );
  }
}

/**
 * Read a local PDF file
 */
async function readLocalPdf(filePath: string): Promise<FileInfo> {
  let resolvedPath = filePath;
  if (filePath.startsWith('file://')) {
    resolvedPath = new URL(filePath).pathname;
  }
  if (!path.isAbsolute(resolvedPath)) {
    resolvedPath = path.resolve(process.cwd(), resolvedPath);
  }

  try {
    const stats = await fs.stat(resolvedPath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${resolvedPath}`);
    }
    const maxSize = 100 * 1024 * 1024;
    if (stats.size > maxSize) {
      throw new Error(`File too large: ${stats.size} bytes (max: ${maxSize} bytes)`);
    }
    const fileName = path.basename(resolvedPath);
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      throw new Error(`File must be a PDF: ${fileName}`);
    }

    const buffer = await fs.readFile(resolvedPath);

    return {
      name: fileName,
      size: buffer.length,
      mimeType: 'application/pdf',
      buffer,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Download a PDF from a remote URL
 */
async function downloadPdf(url: string): Promise<FileInfo> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 120000, // 2 minute timeout
      maxContentLength: 100 * 1024 * 1024, // 100MB max file size
      validateStatus: (status) => status === 200,
    });

    // Extract filename from URL or Content-Disposition header
    let filename = path.basename(new URL(url).pathname);
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    const contentType = response.headers['content-type'];
    if (!contentType?.includes('pdf') && !filename.toLowerCase().endsWith('.pdf')) {
      throw new Error(
        `File must be a PDF. Got content-type: ${contentType}, filename: ${filename}`,
      );
    }

    const buffer = Buffer.from(response.data);

    return {
      name: filename,
      buffer,
      size: buffer.length,
      mimeType: 'application/pdf',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Download timeout - file too large or connection too slow');
      } else if (error.response?.status === 404) {
        throw new Error('PDF not found at the provided URL');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied - URL requires authentication or is blocked');
      } else if (error.response?.status) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      }
    }
    throw error;
  }
}

export const processDocumentTool: ToolDefinition = {
  name: 'process_document',
  description:
    'Upload and process PDF documents from URLs or local files. Supports OCR processing, hierarchical content extraction, and intelligent document analysis. Returns a unique doc_id for subsequent operations. Processing typically takes 0-3 minutes depending on document size (estimate: 2 seconds per page). Supports files up to 100MB.',
  inputSchema: processDocumentSchema,
  handler: processDocument,
};
