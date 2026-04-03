// Used for sending relevant user informations to the client
const appUser = (user, date) => {
  const {createdAt, updatedAt, _id, email, username} = user;
  if (!date) {
    date = updatedAt;
  };
  return {
    id: _id,
    email: email,
    username: username,
    updatedAt: date,
    createdAt: createdAt
  };
};

export default appUser;
