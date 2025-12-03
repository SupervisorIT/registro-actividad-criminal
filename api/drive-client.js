import { google } from 'googleapis';

let driveClient = null;

function getDrive() {
  if (driveClient) return driveClient;

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKeyRaw) {
    console.warn('[Drive] GOOGLE_CLIENT_EMAIL o GOOGLE_PRIVATE_KEY no configurados. Se omite respaldo en Drive.');
    return null;
  }

  // Render/entornos suelen guardar el private key con \n escapadas
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

async function ensureFolder(parentId, name) {
  const drive = getDrive();
  if (!drive) return null;

  try {
    const queryParts = [
      `name = '${name.replace(/'/g, "\\'")}'`,
      "mimeType = 'application/vnd.google-apps.folder'",
      "trashed = false",
    ];
    if (parentId) {
      queryParts.push(`'${parentId}' in parents`);
    }

    const { data } = await drive.files.list({
      q: queryParts.join(' and '),
      fields: 'files(id, name)',
      spaces: 'drive',
      pageSize: 1,
    });

    if (data.files && data.files.length) {
      return data.files[0].id;
    }

    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return res.data.id || null;
  } catch (err) {
    console.error('[Drive] Error asegurando carpeta', name, err?.message || err);
    return null;
  }
}

export async function subirBackupJSON({ username, fechaBase, payload }) {
  const drive = getDrive();
  if (!drive) return;

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) {
    console.warn('[Drive] GOOGLE_DRIVE_ROOT_FOLDER_ID no configurada. Se omite respaldo en Drive.');
    return;
  }

  const userName = (username || 'desconocido').toString().toLowerCase();
  const fecha = (fechaBase || '').toString().slice(0, 10) || 'sin-fecha';

  try {
    const userFolderId = await ensureFolder(rootId, userName);
    if (!userFolderId) return;

    const fechaFolderId = await ensureFolder(userFolderId, fecha);
    if (!fechaFolderId) return;

    const fileName = `resumen_${fecha}.json`;
    const fileMetadata = {
      name: fileName,
      parents: [fechaFolderId],
    };

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(payload ?? {}, null, 2),
    };

    await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id',
    });

    console.log('[Drive] Backup JSON subido para', userName, fecha);
  } catch (err) {
    console.error('[Drive] Error subiendo backup JSON', err?.message || err);
  }
}
