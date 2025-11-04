# NPM Package Debug Report

## Status: ✓ Working

The npm package is configured correctly for ES6 modules with React JSX transformation.

## Configuration

- **Babel**: Only transforms React JSX syntax, keeps ES6 import/export as-is
- **Package Type**: ES Modules (ESM)
- **Main Entry**: `dist/index.esm.js`

## To Test

Run:
```bash
npm run build
node test-package.js
```

Expected output: **"✓ working npm package"**

The package exports both hooks using native ES6 module syntax.