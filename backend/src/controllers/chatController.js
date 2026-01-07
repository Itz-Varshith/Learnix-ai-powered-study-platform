import { PrismaClient } from "../../generated/prisma/client.ts";

const prisma = new PrismaClient();

const MESSAGE_LIMIT = 50; 
const MAX_MESSAGE_LENGTH = 2000; 
const RATE_LIMIT_WINDOW = 1000; 
const RATE_LIMIT_MAX = 5; 

const rateLimitMap = new Map();

const sanitizeMessage = (content) => {
  if (!content || typeof content !== "string") return null;
  const trimmed = content.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_LENGTH) return null;
  return trimmed;
};

const isUserMember = async (userId, courseId) => {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  });
  return !!enrollment;
};

const checkRateLimit = (socketId) => {
  const now = Date.now();
  const record = rateLimitMap.get(socketId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(socketId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
};

const getChatHistory = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { uid } = req.user;
    const { cursor, limit = MESSAGE_LIMIT } = req.query;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course/Study group not found",
      });
    }

    const isMember = await isUserMember(uid, courseId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You must be a member to view chat",
      });
    }

    const queryOptions = {
      where: { courseId },
      orderBy: { createdAt: "desc" },
      take: Math.min(parseInt(limit) || MESSAGE_LIMIT, MESSAGE_LIMIT),
      select: {
        id: true,
        senderId: true,
        senderName: true,
        content: true,
        createdAt: true,
      },
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; 
    }

    const messages = await prisma.chatMessage.findMany(queryOptions);

    return res.status(200).json({
      success: true,
      data: messages.reverse(),
      nextCursor:
        messages.length === queryOptions.take ? messages[0]?.id : null,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching chat history",
      error: error.message,
    });
  }
};



const initializeSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    let currentUser = null;
    let currentRoom = null;

    socket.on("authenticate", async (data) => {
      try {
        const { userId, userName } = data;

        if (!userId || !userName) {
          socket.emit("error", { message: "Authentication required" });
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true },
        });

        if (!user) {
          socket.emit("error", { message: "User not found" });
          return;
        }

        currentUser = { id: user.id, name: user.name };
        socket.emit("authenticated", { success: true });
        console.log(`User authenticated: ${user.name} (${socket.id})`);
      } catch (error) {
        console.error("Socket authentication error:", error);
        socket.emit("error", { message: "Authentication failed" });
      }
    });

    socket.on("join-room", async (data) => {
      try {
        const { courseId } = data;

        if (!currentUser) {
          socket.emit("error", { message: "Please authenticate first" });
          return;
        }

        if (!courseId) {
          socket.emit("error", { message: "Course ID required" });
          return;
        }

        const isMember = await isUserMember(currentUser.id, courseId);
        if (!isMember) {
          socket.emit("error", {
            message: "You must be a member to join this chat",
          });
          return;
        }

        if (currentRoom) {
          socket.leave(currentRoom);
        }

        const roomId = `course:${courseId}`;
        socket.join(roomId);
        currentRoom = roomId;

        socket.emit("joined-room", {
          success: true,
          roomId,
          courseId,
        });

        console.log(`${currentUser.name} joined room: ${roomId}`);
      } catch (error) {
        console.error("Join room error:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("send-message", async (data) => {
      try {
        const { content, courseId } = data;

        if (!currentUser) {
          socket.emit("error", { message: "Please authenticate first" });
          return;
        }

        if (!currentRoom || currentRoom !== `course:${courseId}`) {
          socket.emit("error", { message: "Please join the room first" });
          return;
        }

        if (!checkRateLimit(socket.id)) {
          socket.emit("error", { message: "Slow down! Too many messages." });
          return;
        }

        const sanitizedContent = sanitizeMessage(content);
        if (!sanitizedContent) {
          socket.emit("error", { message: "Invalid message content" });
          return;
        }

        const isMember = await isUserMember(currentUser.id, courseId);
        if (!isMember) {
          socket.emit("error", {
            message: "You are not a member of this group",
          });
          return;
        }

        const message = await prisma.chatMessage.create({
          data: {
            courseId,
            senderId: currentUser.id,
            senderName: currentUser.name, 
            content: sanitizedContent,
          },
          select: {
            id: true,
            senderId: true,
            senderName: true,
            content: true,
            createdAt: true,
          },
        });

        io.to(currentRoom).emit("new-message", message);

        console.log(`Message sent in ${currentRoom} by ${currentUser.name}`);
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      rateLimitMap.delete(socket.id);
    });
  });
};

export { getChatHistory, initializeSocketHandlers };
