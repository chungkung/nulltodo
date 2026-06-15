import fs from 'fs';
import path from 'path';

const configTsPath = path.join(process.cwd(), 'capacitor.config.ts');

if (fs.existsSync(configTsPath)) {
  fs.renameSync(configTsPath, configTsPath + '.backup');
  console.log('Renamed capacitor.config.ts to capacitor.config.ts.backup');
} else {
  console.log('No capacitor.config.ts found');
}
