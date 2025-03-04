import { supabase } from './supabase';

// Tipos de arquivos permitidos
export type AllowedFileTypes = 'image/jpeg' | 'image/png' | 'image/gif' | 'application/pdf';

// Configuração do Storage
export const storage = {
  // Upload de arquivo
  upload: async (
    bucket: string,
    path: string,
    file: File,
    options?: {
      cacheControl?: string;
      upsert?: boolean;
    }
  ) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options);

    if (error) throw error;
    return data;
  },

  // Download de arquivo
  download: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) throw error;
    return data;
  },

  // Listar arquivos
  list: async (bucket: string, path?: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);

    if (error) throw error;
    return data;
  },

  // Deletar arquivo
  delete: async (bucket: string, path: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  },

  // Gerar URL pública
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  // Validar tipo de arquivo
  validateFileType: (file: File): boolean => {
    const allowedTypes: AllowedFileTypes[] = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];
    return allowedTypes.includes(file.type as AllowedFileTypes);
  },

  // Validar tamanho do arquivo (max 5MB)
  validateFileSize: (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return file.size <= maxSize;
  },
}; 