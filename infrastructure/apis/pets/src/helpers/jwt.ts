import jwt from "jsonwebtoken";

export const getUserId = (token: any): any => {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (decoded) {
        return decoded.payload.sub;
      } else {
        console.log("Not decoded");
        throw new Error("Invalid token");
      }
    } catch (error) {
      console.log(error);
      throw new Error("Invalid token");
    }
  };