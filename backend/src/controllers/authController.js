import { PrismaClient } from "../../generated/prisma/client.ts";
const prisma = new PrismaClient();

export const loginUser = async (req, res) => {
  // If request reaches here, middleware has already verified the user
  const { uid, email } = req.user;
  await prisma.user.upsert({
    where: { id: uid },
    update: {
      email: email,
      name: email.split("@")[0],
    },
    create: {
      id: uid,
      email: email,
      name:  req.user.name,
    }
  })
  console.log(`User logged in: ${email}`);
  return res.status(200).json({ 
    message: "User is authenticated", 
    uid,
    email 
  });
};