# Outstanding Issues

## Status: All Issues Resolved ✅

### 1. ESLint Configuration Not Compatible with v10+ - RESOLVED ✅

- **File Path**: `/home/thesicktwist1/workspace/github.com/thesicktwist1/codex-js/eslint.config.js`
- **Issue**: Project uses ESLint v10.1.0 which requires `eslint.config.js`, but configuration was in `.eslintrc.js` (legacy format)
- **Resolution**: Migrated configuration to ESLint v10+ flat config format, installed `@eslint/js` dependency, removed legacy `.eslintrc.js`
- **Status**: ✅ RESOLVED

### 2. Missing .js Extension in Import - RESOLVED ✅

- **File Path**: `/home/thesicktwist1/workspace/github.com/thesicktwist1/codex-js/utils/joiSchemas.js`
- **Line**: 4
- **Issue**: Import statement missing `.js` extension
- **Resolution**: Updated `import appError from './appError';` to `import appError from './appError.js';`
- **Status**: ✅ RESOLVED

### 3. Test Mock Setup Issues - RESOLVED ✅

#### Issue 3a: Missing 'users' Collection in Test Mocks
- **Files Affected**:
  - `/home/thesicktwist1/workspace/github.com/thesicktwist1/codex-js/test/reviewsController.test.js`
  - `/home/thesicktwist1/workspace/github.com/thesicktwist1/codex-js/test/booksController.test.js`
- **Issue**: Database mocks didn't include 'users' collection, causing error when userAuth.js was imported through dependency chain (joiSchemas → userController → userAuth)
- **Resolution**: Added usersCollection mock to both test files' vi.mock() setup
- **Status**: ✅ RESOLVED

#### Issue 3b: userController.js updateUser Bug
- **File Path**: `/home/thesicktwist1/workspace/github.com/thesicktwist1/codex-js/controllers/userController.js`
- **Line**: 52
- **Issue**: Undefined variable `id` - should be `user._id`
- **Resolution**: Changed `findOne({_id: id})` to `findOne({_id: user._id})`
- **Status**: ✅ RESOLVED

#### Issue 3c: Missing currentPassword in Joi Schema
- **File Path**: `/home/thesicktwist1/workspace/github.com/thesicktwist1/codex-js/utils/joiSchemas.js`
- **Issue**: updateUser schema only validated newPassword but not currentPassword
- **Resolution**: Added `currentPassword: joi.string().required()` to updateUser schema
- **Status**: ✅ RESOLVED

#### Issue 3d: Test Expectation Mismatch
- **File Path**: `/home/thesicktwist1/workspace/github.com/thesicktwist1/codex-js/test/userController.test.js`
- **Tests Fixed**:
  1. "updateUser returns 400 on invalid newPassword" - Changed expectation from `res.status()` to `next()` being called (validation errors are thrown and caught by asyncHandler)
  2. "updateUser returns 401 on incorrect current password" - Fixed expected status code from 400 to 401 (UNAUTHORIZED is the correct status when password doesn't match)
- **Status**: ✅ RESOLVED

## Verification Completed

- ✅ npm run lint: Working with new eslint.config.js
- ✅ npm test: All 59 tests passed, no regressions
- ✅ @eslint/js dependency: Installed successfully
- ✅ Legacy .eslintrc.js: Removed
- ✅ Database mocks include all required collections
- ✅ Test expectations match actual controller behavior

