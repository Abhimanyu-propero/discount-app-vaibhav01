//not to use in production

import Cryptr from "cryptr";

const cryption = new Cryptr(process.env.ENCRYPTION_STRING);

export default cryption;