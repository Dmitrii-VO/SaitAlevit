const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to find files recursively (simple implementation without glob package dependency if needed, but we can use simple recursion)
// Since we are in a node environment, let's just use fs.readdirSync recursively.

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

const optimizeImages = async () => {
  const imagesDir = path.join(__dirname, '../images'); // Assuming images are in root/images
  // Also check src/images if it exists, but based on file structure earlier, it's mainly root/images
  // The user showed structure: D:\myprojects\saitgusia\images\ and D:\myprojects\saitgusia\src\images
  
  const rootImages = path.join(__dirname, '../images');
  
  // We will process both if they exist
  const dirsToProcess = [rootImages];
  
  console.log('Starting image optimization...');

  for (const dir of dirsToProcess) {
    if (!fs.existsSync(dir)) {
        console.log(`Directory not found: ${dir}`);
        continue;
    }

    const files = getAllFiles(dir);
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
        const newFile = file.replace(ext, '.webp');
        
        // Skip if webp already exists (optional, but good for re-runs)
        if (fs.existsSync(newFile)) {
            // console.log(`Skipping ${path.basename(file)}, webp already exists.`);
            // continue; 
            // Actually, let's overwrite to ensure optimization settings are applied
        }

        try {
          await sharp(file)
            .webp({ quality: 80 })
            .toFile(newFile);
          
          console.log(`Converted: ${path.basename(file)} -> ${path.basename(newFile)}`);
        } catch (err) {
          console.error(`Error converting ${file}:`, err);
        }
      }
    }
  }
  
  console.log('Image optimization complete!');
};

optimizeImages();
