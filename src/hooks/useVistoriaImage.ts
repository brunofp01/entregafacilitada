import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

export const useVistoriaImage = () => {
  const processImage = async (file: File): Promise<File> => {
    let imageToCompress = file;

    // 1. Verificar se é HEIC e converter para JPEG
    if (file.type === 'image/heic' || file.name.toLocaleLowerCase().endsWith('.heic')) {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      });
      
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      imageToCompress = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
    }

    // 2. Opções de compressão e redimensionamento
    const options = {
      maxSizeMB: 0.5, // Alvo de ~500KB
      maxWidthOrHeight: 1280, // Lado maior 1280px
      useWebWorker: true,
      initialQuality: 0.75, // Qualidade 75%
      fileType: 'image/jpeg'
    };

    try {
      const compressedFile = await imageCompression(imageToCompress, options);
      return compressedFile;
    } catch (error) {
      console.error("Erro na compressão:", error);
      return imageToCompress;
    }
  };

  return { processImage };
};
