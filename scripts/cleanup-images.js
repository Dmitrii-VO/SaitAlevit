const fs = require('fs');
const path = require('path');

const getAllFiles = (dirPath, arrayOfFiles) => {
  files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
};

const cleanupImages = () => {
  const imagesDir = path.join(__dirname, '../images');
  
  if (!fs.existsSync(imagesDir)) {
      console.log('Images directory not found.');
      return;
  }

  const files = getAllFiles(imagesDir);
  let deletedCount = 0;
  let savedSpace = 0;

  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        const webpPath = file.substring(0, file.lastIndexOf('.')) + '.webp';
        
        if (fs.existsSync(webpPath)) {
            try {
                const stats = fs.statSync(file);
                const size = stats.size;
                fs.unlinkSync(file);
                console.log(`Deleted source: ${path.basename(file)} (WebP exists)`);
                deletedCount++;
                savedSpace += size;
            } catch (err) {
                console.error(`Error deleting ${file}:`, err);
            }
        }
    }
  });

  const savedMb = (savedSpace / 1024 / 1024).toFixed(2);
  console.log(`
Cleanup complete!`);
  console.log(`Deleted ${deletedCount} files.`);
  console.log(`Freed up approximately ${savedMb} MB.`);
};

cleanupImages();
