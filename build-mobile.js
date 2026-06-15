import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting NullTodo mobile build process...');

try {
  // Step 1: Backup and prepare config files
  console.log('\n📝 Preparing configuration files...');
  const configTsPath = path.join(__dirname, 'capacitor.config.ts');
  const configJsonPath = path.join(__dirname, 'capacitor.config.json');
  
  if (fs.existsSync(configTsPath)) {
    fs.renameSync(configTsPath, configTsPath + '.backup');
    console.log('   ✓ capacitor.config.ts backed up');
  }

  if (!fs.existsSync(configJsonPath)) {
    const config = {
      appId: 'com.nulltodo.app',
      appName: 'NullTodo',
      webDir: 'dist',
      server: {
        androidScheme: 'https'
      }
    };
    fs.writeFileSync(configJsonPath, JSON.stringify(config, null, 2));
    console.log('   ✓ capacitor.config.json created');
  }

  // Step 2: Initialize Capacitor if not already initialized
  console.log('\n🔧 Initializing Capacitor...');
  try {
    // Check if android or ios folders exist
    const androidExists = fs.existsSync(path.join(__dirname, 'android'));
    const iosExists = fs.existsSync(path.join(__dirname, 'ios'));
    
    if (!androidExists || !iosExists) {
      if (!fs.existsSync(path.join(__dirname, '.capacitor'))) {
        console.log('   Running Capacitor init...');
        execSync('npx cap init NullTodo com.nulltodo.app --web-dir=dist', { 
          cwd: __dirname, 
          stdio: 'inherit' 
        });
      }
    } else {
      console.log('   ✓ Capacitor already initialized');
    }
  } catch (e) {
    console.log('   ℹ️  Capacitor may already be initialized');
  }

  // Step 3: Add Android platform
  console.log('\n📱 Adding Android platform...');
  if (!fs.existsSync(path.join(__dirname, 'android'))) {
    try {
      execSync('npx cap add android', { cwd: __dirname, stdio: 'inherit' });
      console.log('   ✓ Android platform added');
    } catch (e) {
      console.log('   ⚠️  Android platform already added or error occurred');
    }
  } else {
    console.log('   ✓ Android platform already exists');
  }

  // Step 4: Add iOS platform (note: will only work on macOS)
  console.log('\n🍎 Adding iOS platform...');
  if (!fs.existsSync(path.join(__dirname, 'ios')) && process.platform === 'darwin') {
    try {
      execSync('npx cap add ios', { cwd: __dirname, stdio: 'inherit' });
      console.log('   ✓ iOS platform added');
    } catch (e) {
      console.log('   ⚠️  iOS platform already added or error occurred');
    }
  } else if (process.platform !== 'darwin') {
    console.log('   ℹ️  iOS platform requires macOS, skipping');
  } else {
    console.log('   ✓ iOS platform already exists');
  }

  // Step 5: Sync the web build
  console.log('\n🔄 Syncing web build to native platforms...');
  try {
    execSync('npx cap sync', { cwd: __dirname, stdio: 'inherit' });
    console.log('   ✓ Sync complete');
  } catch (e) {
    console.log('   ⚠️  Sync issue, trying copy...');
    try {
      execSync('npx cap copy', { cwd: __dirname, stdio: 'inherit' });
      console.log('   ✓ Copy complete');
    } catch (e2) {
      console.log('   ❌ Copy failed');
    }
  }

  console.log('\n✅ Build preparation complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. For Android: npx cap open android');
  console.log('      - Then in Android Studio: Build -> Build Bundle(s) / APK(s) -> Build APK(s)');
  if (process.platform === 'darwin') {
    console.log('   2. For iOS: npx cap open ios');
    console.log('      - Then in Xcode: Product -> Archive');
  }
  console.log('\n📱 Your NullTodo app is ready to build!');

} catch (error) {
  console.error('\n❌ Error during build process:', error);
  process.exit(1);
}
