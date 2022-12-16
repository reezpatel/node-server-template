import { createHmac } from "crypto";

export const hash = (secret: string, str: string) => {
  const hmac = createHmac("sha512", secret);
  hmac.update(str);

  return hmac.digest("hex");
};
