/**
 * Attach timestamp fields for database documents.
 * When `created` is true both `createdAt` and `updatedAt` are set;
 * otherwise only `updatedAt` is updated.
 */
const databaseObject = (obj, created = false) => {
  const date = new Date();
  if (created) {
    return {...obj, createdAt: date, updatedAt: date};
  } else {
    return {...obj, updatedAt: date};
  }
};

export default databaseObject;
