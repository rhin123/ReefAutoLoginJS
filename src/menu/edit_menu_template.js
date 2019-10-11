export const editMenuTemplate = {
  label: "Account",
  //Look at the boilerplate to get a refrence.
  submenu: [
    //TODO: Should be grayed out if the user hasn't signed in yet.
    { label: "Sign Out", id: "sign_out", accelerator: "", enabled: false },
  ]
};
