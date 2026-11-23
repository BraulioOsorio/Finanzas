import { File } from 'expo-file-system';

const SQLITE_MAGIC = 'SQLite format 3\u0000';

export function assertSqliteBytes(bytes: Uint8Array): void {
  if (bytes.byteLength < 4096) {
    throw new Error(
      'El archivo es demasiado pequeño. Descarga «Neko - My Data» completo (~12 MB), no un enlace HTML.',
    );
  }
  const head = new TextDecoder().decode(bytes.slice(0, 16));
  if (!head.startsWith(SQLITE_MAGIC)) {
    throw new Error(
      'No es un SQLite de NEKO. Elige el archivo «Neko - My Data» del export de la app.',
    );
  }
}

/** Lee el backup binario completo (para deserializar con expo-sqlite). */
export async function readBytesFromPickedUri(pickedUri: string): Promise<Uint8Array> {
  const src = new File(pickedUri);
  try {
    if (src.exists) {
      return await src.bytes();
    }
    const bytes = await src.bytes();
    if (bytes.byteLength > 0) {
      return bytes;
    }
  } catch {
    /* fetch */
  }
  const response = await fetch(pickedUri);
  if (!response.ok) {
    throw new Error('No se pudo acceder al archivo seleccionado.');
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('El archivo seleccionado está vacío.');
  }
  return new Uint8Array(buffer);
}

/**
 * Materializa un archivo elegido con el document picker (file:// o content://)
 * en una ruta local legible por expo-sqlite / lectura de texto.
 */
export async function materializePickedUri(pickedUri: string, dest: File): Promise<void> {
  const src = new File(pickedUri);
  if (dest.exists) {
    dest.delete();
  }

  if (src.exists) {
    await src.copy(dest);
    if (dest.exists && dest.size > 0) {
      return;
    }
  }

  try {
    await src.copy(dest);
    if (dest.exists && dest.size > 0) {
      return;
    }
  } catch {
    /* content:// a veces solo funciona en el intento de copy */
  }

  try {
    const bytes = await src.bytes();
    if (bytes.byteLength > 0) {
      dest.create({ overwrite: true });
      await dest.write(bytes);
      return;
    }
  } catch {
    /* fetch abajo */
  }

  const response = await fetch(pickedUri);
  if (!response.ok) {
    throw new Error('No se pudo acceder al archivo seleccionado.');
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('El archivo seleccionado está vacío.');
  }
  dest.create({ overwrite: true });
  await dest.write(new Uint8Array(buffer));
}

/** Lee texto de un URI del document picker sin depender de `File.exists`. */
export async function readTextFromPickedUri(pickedUri: string): Promise<string> {
  const src = new File(pickedUri);
  if (src.exists) {
    return src.text();
  }
  try {
    return await src.text();
  } catch {
    /* seguir */
  }
  try {
    const bytes = await src.bytes();
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    /* seguir */
  }
  const response = await fetch(pickedUri);
  if (!response.ok) {
    throw new Error('No se pudo leer el archivo seleccionado.');
  }
  return response.text();
}