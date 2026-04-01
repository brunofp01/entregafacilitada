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

    // 2. Opções de compressão e redimensionamento profissionais
    const options = {
      maxSizeMB: 1, // Permitir até 1MB para manter nitidez em 1280px
      maxWidthOrHeight: 1280, // Lado maior 1280px (Pilar 2)
      useWebWorker: true,
      initialQuality: 0.75, // Qualidade 75% (Pilar 2)
      fileType: 'image/jpeg' as const // Garantir JPEG (Pilar 2)
    };

    try {
      const compressedFile = await imageCompression(imageToCompress, options);
      // Garantir que o nome termine em .jpg
      const finalFile = new File(
        [compressedFile], 
        file.name.replace(/\.[^/.]+$/, "") + ".jpg", 
        { type: 'image/jpeg' }
      );
      return finalFile;
    } catch (error) {
      console.error("Erro na compressão:", error);
      return imageToCompress;
    }
  };

  return { processImage };
};
