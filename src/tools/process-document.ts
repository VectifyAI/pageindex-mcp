import fs from 'node:fs/promises';
import path from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import pRetry, { AbortError } from 'p-retry';
import { z } from 'zod';
import type { PageIndexMcpClient } from '../client/mcp-client.js';
import { createErrorResponse } from '../result.js';
import type { ToolDefinition } from './types.js';

// Schema for process document parameters - accepts both URLs and local file paths
const processDocumentSchema = z.object({
  url: z.string().describe('URL to a PDF document or local file path'),
});

type ProcessDocumentParams = z.infer<typeof processDocumentSchema>;

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
async function processDocument(
  params: ProcessDocumentParams,
  mcpClient: PageIndexMcpClient,
): Promise<CallToolResult> {
  const { url: rawUrl } = params;
  const url = rawUrl.trim();

  try {
    const isLocal = !url.startsWith('http://') && !url.startsWith('https://');
    const fileInfo: FileInfo = isLocal
      ? await readLocalPdf(url)
      : await downloadPdf(url);

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

    const uploadResponse = await fetch(uploadInfo.upload_url, {
      method: 'PUT',
      body: fileInfo.buffer,
      headers: {
        'Content-Type': fileInfo.mimeType,
      },
      signal: AbortSignal.timeout(2 * 60000),
    });
    if (uploadResponse.status !== 200) {
      throw new Error(
        `File upload failed with status ${uploadResponse.status}`,
      );
    }

    const submitResult = await mcpClient.callTool('submit_document', {
      file_name: uploadInfo.file_name,
    });
    return submitResult;
  } catch (error) {
    // Handle PDF validation errors with specific guidance
    if (
      error instanceof Error &&
      error.message?.includes('Not a valid PDF file')
    ) {
      return createErrorResponse(
        error.message,
        {},
        {
          next_steps: {
            immediate: 'The file is not a valid PDF document.',
            options: [
              'Verify the URL points directly to a PDF file, not a webpage',
              'Check if the URL requires authentication or specific headers',
              'Try accessing the URL in a browser to see what content it returns',
            ],
            auto_retry: 'You can retry with a valid PDF URL',
          },
        },
      );
    }

    // Handle arxiv-specific retry failures
    if (error instanceof Error && error.name === 'ArxivRetryFailed') {
      return createErrorResponse(
        error.message,
        {},
        {
          next_steps: {
            immediate:
              'Failed to retrieve PDF from arXiv. Both original URL and .pdf suffix were tried.',
            options: [
              'Verify the arXiv paper ID is correct (format: YYMM.NNNNN)',
              'Try the direct PDF URL: https://arxiv.org/pdf/PAPER_ID.pdf',
              'Check if the paper exists by visiting https://arxiv.org/abs/PAPER_ID',
            ],
            auto_retry: 'You can retry with the correct arXiv URL format',
          },
        },
      );
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error occurred',
      {},
      {
        next_steps: {
          immediate:
            'PDF processing failed. Please check the file/URL and try again.',
          options: [
            'Ensure the file is a valid PDF',
            'Check file size is under 100MB',
            'Verify the URL is accessible (for remote files)',
            'Try with a different PDF document',
          ],
          auto_retry:
            'You can retry with the same document, or try a different one',
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
  const stats = await fs.stat(resolvedPath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${resolvedPath}`);
  }
  const maxSize = 100 * 1024 * 1024;
  if (stats.size > maxSize) {
    throw new Error(
      `File too large: ${stats.size} bytes (max: ${maxSize} bytes)`,
    );
  }
  const fileName = path.basename(resolvedPath);
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    throw new Error(`File must be a PDF: ${fileName}`);
  }

  const buffer = await fs.readFile(resolvedPath);

  // Validate PDF magic bytes
  if (!buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
    throw new Error(`Not a valid PDF file: ${fileName}`);
  }

  return {
    name: fileName,
    size: buffer.length,
    mimeType: 'application/pdf',
    buffer,
  };
}

/**
 * Download a PDF from a remote URL with arXiv compatibility and validation
 */
async function downloadPdf(url: string): Promise<FileInfo> {
  return pRetry(
    async () => {
      const fetchWithRetry = async (fetchUrl: string): Promise<Response> => {
        const response = await fetch(fetchUrl, {
          signal: AbortSignal.timeout(120000), // 2 minute timeout
          headers: {
            Accept: 'application/pdf, application/octet-stream, */*',
            'User-Agent': 'Mozilla/5.0 (compatible; PDF-Processor/1.0)',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      };

      let response: Response;
      try {
        response = await fetchWithRetry(url);
      } catch (error: any) {
        // For arxiv.org URLs, try adding .pdf suffix if original request failed
        if (url.includes('arxiv.org') && !url.endsWith('.pdf')) {
          console.log(
            `Initial request failed for arxiv URL: ${url}, retrying with .pdf suffix`,
          );
          const retryUrl = url.endsWith('/') ? `${url}pdf` : `${url}.pdf`;

          try {
            response = await fetchWithRetry(retryUrl);
            console.log(
              `Successfully retrieved PDF from retry URL: ${retryUrl}`,
            );
          } catch (retryError: any) {
            console.log(
              `Retry with .pdf suffix also failed: ${retryError.message}`,
            );
            const enhancedError = new AbortError(
              `Failed to retrieve PDF from ${url}. Tried both original URL and ${retryUrl}`,
            );
            enhancedError.name = 'ArxivRetryFailed';
            throw enhancedError;
          }
        } else {
          throw error;
        }
      }

      // Check content length
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > 100 * 1024 * 1024) {
        throw new Error(`File too large: ${contentLength} bytes (max: 100MB)`);
      }

      // Extract filename from URL or Content-Disposition header
      let filename = path.basename(new URL(url).pathname);
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Ensure filename has .pdf extension if not present
      if (!filename.toLowerCase().endsWith('.pdf')) {
        filename = `${filename}.pdf`;
      }

      const contentType = response.headers.get('content-type');

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate PDF magic bytes
      if (!buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
        throw new AbortError(
          `Not a valid PDF file. Got content-type: ${contentType}, filename: ${filename}`,
        );
      }

      // Additional content-type validation (more lenient after magic byte check)
      if (
        contentType &&
        !contentType.includes('pdf') &&
        !contentType.includes('octet-stream') &&
        !contentType.includes('application/pdf')
      ) {
        console.warn(
          `Unexpected content-type: ${contentType}, but PDF magic bytes validated`,
        );
      }

      return {
        name: filename,
        buffer,
        size: buffer.length,
        mimeType: 'application/pdf',
      };
    },
    {
      retries: 3,
      factor: 2,
      minTimeout: 2000,
      maxTimeout: 10000,
      onFailedAttempt: (error) => {
        // Don't retry on client errors (4xx) except 429 (rate limiting)
        if (error instanceof Error && error.message.includes('HTTP ')) {
          const statusMatch = error.message.match(/HTTP (\d+)/);
          const status = statusMatch ? parseInt(statusMatch[1], 10) : undefined;
          if (status && status >= 400 && status < 500 && status !== 429) {
            throw new AbortError(
              status === 404
                ? 'PDF not found at the provided URL'
                : status === 403
                  ? 'Access denied - URL requires authentication or is blocked'
                  : error.message,
            );
          }
        }

        // Don't retry ArxivRetryFailed errors
        if (error.name === 'ArxivRetryFailed') {
          throw error;
        }

        console.warn(
          `PDF download attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left. URL: ${url}`,
        );
      },
    },
  );
}

export const processDocumentTool: ToolDefinition = {
  name: 'process_document',
  description:
    'Upload and process PDF documents from URLs or local files. Supports OCR processing, hierarchical content extraction, and intelligent document analysis. Returns a unique doc_id for subsequent operations. Processing typically takes 0-3 minutes depending on document size (estimate: 2 seconds per page). Supports files up to 100MB.',
  inputSchema: processDocumentSchema,
  handler: processDocument,
};
