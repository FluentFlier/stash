import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadRoutes(fastify: FastifyInstance) {
  // Upload file (authenticated)
  fastify.post(
    '/api/uploads',
    {
      preHandler: [(request: any, reply: any) => (fastify as any).authenticate(request, reply)],
    },
    async (request, reply) => {
      try {
        const file = await (request as any).file();
        if (!file) {
          return reply.code(400).send({ success: false, error: 'Missing file' });
        }

        const userId = request.user.id;
        const safeName = sanitizeFileName(file.filename || 'upload');
        const fileName = `${Date.now()}-${safeName}`;

        if (config.database.supabaseUrl && config.database.supabaseServiceKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            config.database.supabaseUrl,
            config.database.supabaseServiceKey,
            { auth: { persistSession: false } }
          );

          const chunks: Buffer[] = [];
          await new Promise<void>((resolve, reject) => {
            file.file.on('data', (chunk: Buffer) => chunks.push(chunk));
            file.file.on('end', () => resolve());
            file.file.on('error', (err: Error) => reject(err));
          });
          const buffer = Buffer.concat(chunks);

          const storagePath = `${userId}/${fileName}`;
          const { error } = await supabase.storage
            .from(config.database.supabaseStorageBucket)
            .upload(storagePath, buffer, {
              contentType: file.mimetype,
              upsert: false,
            });

          if (error) {
            logger.error('[Upload] Supabase upload failed:', error);
            return reply.code(500).send({ success: false, error: 'Upload failed' });
          }

          const { data } = supabase.storage
            .from(config.database.supabaseStorageBucket)
            .getPublicUrl(storagePath);

          logger.info(`[Upload] Stored file in Supabase for user ${userId}: ${fileName}`);

          return {
            success: true,
            data: {
              fileName,
              mimeType: file.mimetype,
              size: buffer.length,
              url: data.publicUrl,
            },
          };
        }

        const uploadRoot = path.resolve(config.upload.dir);
        const userDir = path.join(uploadRoot, userId);
        await fs.promises.mkdir(userDir, { recursive: true });

        const filePath = path.join(userDir, fileName);

        await pipeline(file.file, fs.createWriteStream(filePath));

        const url = `${config.server.apiUrl}/uploads/${userId}/${fileName}`;

        logger.info(`[Upload] Stored file locally for user ${userId}: ${fileName}`);

        return {
          success: true,
          data: {
            fileName,
            mimeType: file.mimetype,
            size: file.file.bytesRead ?? undefined,
            url,
          },
        };
      } catch (error: any) {
        logger.error('[Upload] Error handling upload:', error);
        return reply.code(500).send({ success: false, error: 'Upload failed' });
      }
    }
  );

  // Serve uploaded files (public)
  fastify.get('/uploads/:userId/:fileName', async (request, reply) => {
    const { userId, fileName } = request.params as { userId: string; fileName: string };
    const safeFileName = sanitizeFileName(fileName);
    const filePath = path.resolve(config.upload.dir, userId, safeFileName);

    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
      return reply.send(fs.createReadStream(filePath));
    } catch (error) {
      return reply.code(404).send({ success: false, error: 'File not found' });
    }
  });
}
