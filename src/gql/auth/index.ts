import { addMinutes } from "date-fns";
import { Resolvers } from "../../generated-types";
import { hash } from "../../utils/hash";
import { sign, decode, verify } from "jsonwebtoken";

const resolver: Resolvers = {
  Mutation: {
    registerWithCredentials: async (_, { input }, { app }) => {
      const { email, password, name } = input;

      const user = await app.prisma.user.findFirst({
        where: { email, verified: true },
      });

      if (user) {
        return {
          success: false,
          error: "USER_ALREADY_EXISTS",
        };
      }

      await app.prisma.user.deleteMany({ where: { email } });

      const newUser = await app.prisma.user.create({
        data: {
          email,
          username: email,
          name,
          password: hash(app.config.AUTH_SECRET, password),
        },
      });

      await app.prisma.shortCode.create({
        data: {
          code: 0,
          expireAt: addMinutes(new Date(), 5),
          userId: newUser.id,
        },
      });

      return {
        error: "",
        id: newUser.id,
        success: true,
      };
    },
    confirmCredentialsRegistration: async (_, { code, id }, { app }) => {
      const isPresent = app.prisma.shortCode.count({
        where: { code, userId: id, expireAt: { gt: new Date() } },
      });

      if (!isPresent) {
        return {
          success: false,
          error: "INVALID_CODE",
        };
      }

      const token = sign(
        {
          userId: id,
        },
        app.config.AUTH_SECRET,
        { expiresIn: "7d" }
      );

      const user = await app.prisma.user.update({
        where: { id },
        data: { verified: true },
        select: {
          id: true,
          name: true,
        },
      });

      return {
        success: true,
        error: "",
        id: user.id,
        user,
        token,
      };
    },
    signInWithCredentials: async (_, { email, password }, { app }) => {
      const user = await app.prisma.user.findFirst({
        where: {
          email,
          password: hash(app.config.AUTH_SECRET, password),
          verified: true,
        },
      });

      if (!user) {
        return {
          error: "INVALID_CREDENTIALS",
          success: false,
        };
      }

      const token = sign(
        {
          userId: user.id,
        },
        app.config.AUTH_SECRET,
        { expiresIn: "7d" }
      );

      return {
        success: true,
        error: "",
        token,
        user,
      };
    },
  },
  Query: {
    AuthUser: async (_, { token }, { app }) => {
      if (!token) {
        return null;
      }

      const valid = verify(token, app.config.AUTH_SECRET);

      if (!valid) {
        return null;
      }

      const data = decode(token, { json: true });

      if (!data) {
        return null;
      }

      console.log(data);

      const user = await app.prisma.user.findFirst({
        where: {
          id: data.id,
        },
      });

      return user;
    },
  },
};

export default resolver;
