import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { Project } from '../../domain/project/Project.ts'

const DB_NAME = 'gltf-editor'
const DB_VERSION = 1
const STORE = 'projects'

interface StoredProject {
  id: string
  name: string
  updatedAt: number
  project: Project
}

interface EditorDB extends DBSchema {
  projects: {
    key: string
    value: StoredProject
    indexes: { 'by-updated': number }
  }
}

export interface ProjectSummary {
  id: string
  name: string
  updatedAt: number
}

let dbPromise: Promise<IDBPDatabase<EditorDB>> | null = null

const getDb = (): Promise<IDBPDatabase<EditorDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<EditorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('by-updated', 'updatedAt')
      },
    })
  }
  return dbPromise
}

/** CRUD for projects in IndexedDB. Projects are JSON-safe (textures as data URLs). */
export const ProjectRepository = {
  async save(project: Project): Promise<void> {
    const db = await getDb()
    await db.put(STORE, {
      id: project.meta.id,
      name: project.meta.name,
      updatedAt: project.meta.updatedAt,
      project,
    })
  },

  async load(id: string): Promise<Project | null> {
    const db = await getDb()
    const record = await db.get(STORE, id)
    return record?.project ?? null
  },

  async list(): Promise<ProjectSummary[]> {
    const db = await getDb()
    const all = await db.getAll(STORE)
    return all
      .map(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  },

  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORE, id)
  },
}
