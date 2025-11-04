// Simple test to verify the npm package exports work correctly
import('file:///' + process.cwd().replace(/\\/g, '/') + '/dist/index.esm.js')
  .then(packageExports => {
    console.log('Testing npm package...\n');
    
    const exportKeys = Object.keys(packageExports);
    console.log('Package exports:', exportKeys);
    
    const hasUseWindowSize = typeof packageExports.useWindowSize === 'function';
    const hasUseActionState = typeof packageExports.useActionState === 'function';
    
    console.log('\nuseWindowSize exported:', hasUseWindowSize);
    console.log('useActionState exported:', hasUseActionState);
    
    if (hasUseWindowSize && hasUseActionState) {
      console.log('\n✓ working npm package');
      process.exit(0);
    } else {
      console.log('\n✗ Package is missing expected exports');
      console.log('Expected: useWindowSize, useActionState');
      console.log('Got:', exportKeys);
      process.exit(1);
    }
  })
  .catch(err => {
    console.log('Error loading package:', err.message);
    process.exit(1);
  });
