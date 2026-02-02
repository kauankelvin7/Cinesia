/**
 * 🖼️ IMAGE COMPRESSOR - Compressão de Imagens para Base64
 * 
 * Redimensiona e comprime imagens para armazenamento no Firestore
 * - Máximo: 800px de largura
 * - Formato: JPEG 60% de qualidade
 * - Saída: String Base64 com data URI completo
 * - Limite: ~800KB (1MB do Firestore)
 */

/**
 * Comprime uma imagem para Base64
 * @param {File} file - Arquivo de imagem (jpg, png, gif, webp)
 * @param {number} maxWidth - Largura máxima em pixels (padrão: 800)
 * @param {number} quality - Qualidade JPEG de 0-1 (padrão: 0.6 = 60%)
 * @returns {Promise<string>} - Data URI com Base64 ('data:image/jpeg;base64,...')
 * @throws {Error} - Se arquivo não for imagem ou houver erro na compressão
 */
export const compressImage = (file, maxWidth = 800, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    // Validação de arquivo
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Arquivo deve ser uma imagem válida (jpg, png, gif, webp)'));
      return;
    }

    // Limite de tamanho antes da compressão (20MB)
    if (file.size > 20 * 1024 * 1024) {
      reject(new Error('Imagem muito grande (máximo 20MB)'));
      return;
    }

    // Criar FileReader para ler arquivo
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        // Criar imagem a partir do arquivo
        const img = new Image();
        
        img.onload = () => {
          try {
            // Criar canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('Não foi possível obter contexto do canvas');
            }
            
            // Calcular dimensões mantendo proporção
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
              const ratio = maxWidth / width;
              width = maxWidth;
              height = Math.round(height * ratio);
            }
            
            // Definir dimensões do canvas
            canvas.width = width;
            canvas.height = height;
            
            // Preencher fundo branco (para PNGs com transparência)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            
            // Desenhar imagem redimensionada
            ctx.drawImage(img, 0, 0, width, height);
            
            // Converter para Base64 com qualidade específica
            const base64String = canvas.toDataURL('image/jpeg', quality);
            
            // Validar tamanho final (~1MB máximo)
            const sizeInBytes = base64String.length * 0.75; // Base64 é ~33% maior
            if (sizeInBytes > 1024 * 1024) {
              console.warn(
                `⚠️ Imagem comprimida ocupa ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB. ` +
                `Pode ser muito grande para Firestore.`
              );
            }
            
            // Retornar Base64 completo com data URI
            resolve(base64String);
            
          } catch (error) {
            reject(new Error(`Erro ao processar imagem: ${error.message}`));
          }
        };
        
        img.onerror = () => {
          reject(new Error('Não foi possível carregar a imagem'));
        };
        
        // Definir origem para CORS (se necessário)
        img.crossOrigin = 'anonymous';
        img.src = event.target.result;
        
      } catch (error) {
        reject(new Error(`Erro ao ler arquivo: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo do sistema'));
    };
    
    // Ler arquivo como Data URL
    reader.readAsDataURL(file);
  });
};

/**
 * Obtém informações sobre a imagem comprimida
 * @param {string} base64String - String Base64 com data URI
 * @returns {Object} - { tamanhoKB, tamanhoMB, tipo, avisos }
 */
export const getImageInfo = (base64String) => {
  try {
    const sizeInBytes = base64String.length * 0.75;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(3);
    
    const tipo = base64String.includes('image/jpeg') 
      ? 'JPEG'
      : base64String.includes('image/png')
      ? 'PNG'
      : 'Outro';
    
    const avisos = [];
    if (sizeInBytes > 800 * 1024) {
      avisos.push('⚠️ Imagem ocupa mais de 800KB');
    }
    if (sizeInBytes > 1024 * 1024) {
      avisos.push('❌ ERRO: Imagem ocupa mais de 1MB (limite Firestore)');
    }
    
    return {
      tamanhoKB: parseFloat(sizeInKB),
      tamanhoMB: parseFloat(sizeInMB),
      tipo,
      avisos
    };
  } catch (error) {
    return {
      tamanhoKB: 0,
      tamanhoMB: 0,
      tipo: 'Desconhecido',
      avisos: ['Erro ao calcular tamanho']
    };
  }
};

/**
 * Remove prefixo 'data:image/...' se necessário
 * @param {string} base64String - String com ou sem prefixo
 * @returns {string} - String Base64 pura (sem prefixo)
 */
export const getBase64Pure = (base64String) => {
  const parts = base64String.split(',');
  return parts.length > 1 ? parts[1] : base64String;
};

/**
 * Restaura data URI a partir de Base64 puro
 * @param {string} pureBase64 - String Base64 pura
 * @returns {string} - Data URI completo
 */
export const getDataURI = (pureBase64) => {
  return `data:image/jpeg;base64,${pureBase64}`;
};

export default {
  compressImage,
  getImageInfo,
  getBase64Pure,
  getDataURI
};
