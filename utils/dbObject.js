
const databaseObject = (obj, created = false) => {
  const date = new Date();
  if (created) {
    return {...obj, createdAt: date, updatedAt: date};
  } else {
    return {...obj, updatedAt: date};
  }
};

export default databaseObject;
