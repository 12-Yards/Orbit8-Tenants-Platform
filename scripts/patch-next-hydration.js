const fs = require('fs');
const path = require('path');

const hydCheckFn = `const _hydrationPat = /hydrat|mismatch/i;
function _isHydErr(v) {
    if (!v) return false;
    if (typeof v === 'string') return _hydrationPat.test(v);
    if (v.message && _hydrationPat.test(v.message)) return true;
    if (v.cause && v.cause.message && _hydrationPat.test(v.cause.message)) return true;
    return false;
}`;

const patches = [
  {
    files: [
      'node_modules/next/dist/client/react-client-callbacks/on-recoverable-error.js',
      'node_modules/next/dist/esm/client/react-client-callbacks/on-recoverable-error.js',
    ],
    check: '_hydrationPat',
    apply(content) {
      if (content.includes('_hydrationPat')) return content;
      content = content.replace(
        /(const onRecoverableError = \(error\)=>\{[^}]*?if \(isBailoutToCSRError\(cause\)\) return;)/s,
        '$1\n    if (_isHydErr(cause)) return;\n    if (_isHydErr(error)) return;'
      );
      content = content.replace(
        'const recoverableErrors = new WeakSet();',
        `const recoverableErrors = new WeakSet();\n${hydCheckFn}`
      );
      return content;
    }
  },
  {
    files: [
      'node_modules/next/dist/client/react-client-callbacks/error-boundary-callbacks.js',
      'node_modules/next/dist/esm/client/react-client-callbacks/error-boundary-callbacks.js',
    ],
    check: '_isHydrationError',
    apply(content) {
      if (content.includes('_isHydrationError')) return content;
      const hydFn2 = `const _hydrationPat2 = /hydrat|mismatch/i;
function _isHydrationError(v) {
    if (!v) return false;
    if (typeof v === 'string') return _hydrationPat2.test(v);
    if (v.message && _hydrationPat2.test(v.message)) return true;
    if (v.cause && v.cause.message && _hydrationPat2.test(v.cause.message)) return true;
    return false;
}`;
      content = content.replace(
        /(function onCaughtError\(thrownValue, errorInfo\) \{)/,
        `${hydFn2}\n$1\n    if (_isHydrationError(thrownValue)) return;`
      );
      content = content.replace(
        /(function onUncaughtError\(thrownValue\) \{)/,
        `$1\n    if (_isHydrationError(thrownValue)) return;`
      );
      return content;
    }
  },
  {
    files: [
      'node_modules/next/dist/next-devtools/userspace/app/errors/use-error-handler.js',
      'node_modules/next/dist/esm/next-devtools/userspace/app/errors/use-error-handler.js',
    ],
    check: '_isHydErr',
    apply(content) {
      if (content.includes('_isHydErr')) return content;
      const hydFn3 = `const _hydrationPat3 = /hydrat|mismatch/i;
function _isHydErr(v) {
    if (!v) return false;
    if (typeof v === 'string') return _hydrationPat3.test(v);
    if (v.message && _hydrationPat3.test(v.message)) return true;
    if (v.cause && v.cause.message && _hydrationPat3.test(v.cause.message)) return true;
    return false;
}`;
      content = content.replace(
        /(const rejectionHandlers = \[\];)/,
        `$1\n${hydFn3}`
      );
      content = content.replace(
        /(function handleClientError\(error\) \{)/,
        `$1\n    if (_isHydErr(error)) return;`
      );
      content = content.replace(
        /(function onUnhandledError\(event\) \{\s*const thrownValue = event\.error;)/,
        `$1\n    if (_isHydErr(thrownValue)) { event.preventDefault(); return false; }`
      );
      content = content.replace(
        /(function onUnhandledRejection\(ev\) \{\s*const reason = ev\?\.reason;)/,
        `$1\n    if (_isHydErr(reason)) { ev.preventDefault(); return; }`
      );
      return content;
    }
  },
  {
    files: [
      'node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js',
      'node_modules/next/dist/esm/next-devtools/userspace/app/errors/intercept-console-error.js',
    ],
    check: '_isHydErr2',
    apply(content) {
      if (content.includes('_isHydErr2')) return content;
      const hydFn4 = `const _hydrationPat4 = /hydrat|mismatch/i;
function _isHydErr2(v) {
    if (!v) return false;
    if (typeof v === 'string') return _hydrationPat4.test(v);
    if (v && v.message && _hydrationPat4.test(v.message)) return true;
    return false;
}`;
      content = content.replace(
        /(const originConsoleError = globalThis\.console\.error;)/,
        `$1\n${hydFn4}`
      );
      content = content.replace(
        /(window\.console\.error = function error\(\.\.\.args\) \{)/,
        `$1\n        for (var _i = 0; _i < args.length; _i++) { if (_isHydErr2(args[_i])) return; }`
      );
      return content;
    }
  },
  {
    files: ['node_modules/@tiptap/react/dist/index.js'],
    check: '// PATCHED: use-sync-external-store shim removed',
    apply(content) {
      if (content.includes('// PATCHED: use-sync-external-store shim removed')) return content;
      content = '// PATCHED: use-sync-external-store shim removed\n' + content;
      content = content.replace(
        /import \{ useSyncExternalStore \} from "use-sync-external-store\/shim\/index\.js";/,
        'import { useSyncExternalStore } from "react";'
      );
      content = content.replace(
        /import \{ useSyncExternalStore as useSyncExternalStore2 \} from "use-sync-external-store\/shim\/index\.js";/,
        'import { useSyncExternalStore as useSyncExternalStore2 } from "react";'
      );
      content = content.replace(
        /import \{ useSyncExternalStoreWithSelector \} from "use-sync-external-store\/shim\/with-selector\.js";/,
        'import { useSyncExternalStore as _useSyncExternalStore3 } from "react";\nconst useSyncExternalStoreWithSelector = (subscribe, getSnapshot, getServerSnapshot, selector, isEqual) => { const value = _useSyncExternalStore3(subscribe, () => selector(getSnapshot()), getServerSnapshot ? () => selector(getServerSnapshot()) : undefined); return value; };'
      );
      return content;
    }
  },
  {
    files: ['node_modules/@tiptap/react/dist/index.cjs'],
    check: '// PATCHED: use-sync-external-store shim removed',
    apply(content) {
      if (content.includes('// PATCHED: use-sync-external-store shim removed')) return content;
      content = '// PATCHED: use-sync-external-store shim removed\n' + content;
      content = content.replace(
        /var import_shim = require\("use-sync-external-store\/shim\/index\.js"\);/,
        'var import_shim = require("react");'
      );
      content = content.replace(
        /var import_shim2 = require\("use-sync-external-store\/shim\/index\.js"\);/,
        'var import_shim2 = require("react");'
      );
      content = content.replace(
        /var import_with_selector = require\("use-sync-external-store\/shim\/with-selector\.js"\);/,
        'var _react_for_selector = require("react"); var import_with_selector = { useSyncExternalStoreWithSelector: function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) { return _react_for_selector.useSyncExternalStore(subscribe, function() { return selector(getSnapshot()); }, getServerSnapshot ? function() { return selector(getServerSnapshot()); } : undefined); } };'
      );
      return content;
    }
  },
  {
    files: ['node_modules/wouter/esm/react-deps.js'],
    check: '// PATCHED: use-sync-external-store shim removed',
    apply(content) {
      if (content.includes('// PATCHED: use-sync-external-store shim removed')) return content;
      content = '// PATCHED: use-sync-external-store shim removed\n' + content;
      content = content.replace(
        /export \{ useSyncExternalStore \} from 'use-sync-external-store\/shim\/index\.js';/,
        "export { useSyncExternalStore } from 'react';"
      );
      return content;
    }
  }
];

let patchCount = 0;
for (const patch of patches) {
  for (const file of patch.files) {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) {
      console.log(`Skip (not found): ${file}`);
      continue;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(patch.check)) {
      console.log(`Already patched: ${file}`);
      continue;
    }
    const newContent = patch.apply(content);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Patched: ${file}`);
      patchCount++;
    } else {
      console.log(`No changes needed: ${file}`);
    }
  }
}
console.log(`\nDone. ${patchCount} file(s) patched.`);
