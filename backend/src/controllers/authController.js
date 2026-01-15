import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const loginUser = async (req, res) => {
  // If request reaches here, middleware has already verified the user
  const { uid, email, name } = req.user;
  await prisma.user.upsert({
    where: { id: uid },
    update: {
      email: email,
      name: name,
    },
    create: {
      id: uid,
      email: email,
      name: name,
    },
  });
  console.log(`User logged in: ${email}`);
  return res.status(200).json({
    message: "User is authenticated",
    uid,
    email,
  });
};
