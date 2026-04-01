import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

export const useVistoriaImage = () => {
  const processImage = async (file: File, isLogo: boolean = false): Promise<File> => {
    let imageToCompress = file;

    // 1. Verificar se é HEIC e converter
    if (file.type === 'image/heic' || file.name.toLocaleLowerCase().endsWith('.heic')) {
      const convertedBlob = await heic2any({
        blob: file,
        toType: isLogo ? 'image/png' : 'image/jpeg',
        quality: isLogo ? 0.9 : 0.8
      });
      
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const ext = isLogo ? ".png" : ".jpg";
      const type = isLogo ? "image/png" : "image/jpeg";
      
      imageToCompress = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ext, { type });
    }

    // 2. Opções de compressão e redimensionamento profissionais
    const options = {
      maxSizeMB: isLogo ? 0.8 : 1, // Logos podem ser um pouco menores se possível
      maxWidthOrHeight: 1280, // Lado maior 1280px
      useWebWorker: true,
      initialQuality: 0.75, // Qualidade 75%
      fileType: (isLogo ? 'image/png' : 'image/jpeg') as any
    };

    try {
      const compressedFile = await imageCompression(imageToCompress, options);
      const ext = isLogo ? ".png" : ".jpg";
      const type = isLogo ? "image/png" : "image/jpeg";
      
      const finalFile = new File(
        [compressedFile], 
        file.name.replace(/\.[^/.]+$/, "") + ext, 
        { type }
      );
      return finalFile;
    } catch (error) {
      console.error("Erro na compressão:", error);
      return imageToCompress;
    }
  };

  return { processImage };
};
