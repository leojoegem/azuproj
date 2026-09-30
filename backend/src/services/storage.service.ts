import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { env } from '../config/env'
import { AppError } from '../utils/errors'

const extensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
}

export interface StoredObject {
  storagePath: string
  storedName: string
}

export interface ObjectStorage {
  put(input: {
    buffer: Buffer
    contentType: string
    entityType: string
    entityId: string
  }): Promise<StoredObject>
  read(storagePath: string): Promise<Buffer>
}

class LocalObjectStorage implements ObjectStorage {
  root = path.resolve(env.UPLOAD_DIR)

  async put(input: {
    buffer: Buffer
    contentType: string
    entityType: string
    entityId: string
  }): Promise<StoredObject> {
    const extension = extensions[input.contentType]
    if (!extension) throw new AppError(400, 'Unsupported file type.')
    const storedName = `${crypto.randomUUID()}${extension}`
    const storagePath = path.posix.join(input.entityType.toLowerCase(), input.entityId, storedName)
    const full = this.resolve(storagePath)
    await fs.mkdir(path.dirname(full), { recursive: true })
    await fs.writeFile(full, input.buffer)
    return { storagePath, storedName }
  }

  async read(storagePath: string) {
    return fs.readFile(this.resolve(storagePath))
  }

  private resolve(storagePath: string) {
    const full = path.resolve(this.root, storagePath)
    if (!full.startsWith(this.root + path.sep) && full !== this.root) {
      throw new AppError(400, 'Invalid storage path.')
    }
    return full
  }
}

export const storage: ObjectStorage = new LocalObjectStorage()

export function displayFileName(original: string) {
  const base = path.basename(original).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120)
  return base || 'evidence'
}
