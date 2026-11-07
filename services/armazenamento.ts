// Guarda o lote atual no próprio navegador (IndexedDB), para um F5 não apagar as imagens.
// Nada sai do aparelho. Se o navegador bloquear o armazenamento, o app segue funcionando sem salvar.
import { GeneratedCarousel } from '../types';

const BANCO = 'criador-ilustracoes';
const TABELA = 'lote';
const CHAVE = 'atual';

const abrir = (): Promise<IDBDatabase> =>
  new Promise((ok, falha) => {
    const req = indexedDB.open(BANCO, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(TABELA);
    req.onsuccess = () => ok(req.result);
    req.onerror = () => falha(req.error);
  });

export const salvarLote = async (lote: GeneratedCarousel | null): Promise<void> => {
  try {
    const db = await abrir();
    await new Promise<void>((ok, falha) => {
      const tx = db.transaction(TABELA, 'readwrite');
      if (lote) tx.objectStore(TABELA).put(lote, CHAVE);
      else tx.objectStore(TABELA).delete(CHAVE);
      tx.oncomplete = () => ok();
      tx.onerror = () => falha(tx.error);
    });
    db.close();
  } catch {
    /* sem armazenamento: segue sem salvar */
  }
};

export const carregarLote = async (): Promise<GeneratedCarousel | null> => {
  try {
    const db = await abrir();
    const lote = await new Promise<GeneratedCarousel | null>((ok, falha) => {
      const req = db.transaction(TABELA, 'readonly').objectStore(TABELA).get(CHAVE);
      req.onsuccess = () => ok((req.result as GeneratedCarousel) || null);
      req.onerror = () => falha(req.error);
    });
    db.close();
    return lote;
  } catch {
    return null;
  }
};
