const Conversation = require('../models/Chat');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/error.middleware');

exports.getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
    isActive: true,
  })
    .populate('participants', 'name avatar role isActive')
    .sort({ updatedAt: -1 })
    .select('-messages');

  const formattedConversations = conversations.map((conv) => {
    const unread = conv.unreadCounts?.find((u) => u.user.toString() === req.user._id.toString());
    return { ...conv.toObject(), unreadCount: unread?.count || 0 };
  });

  res.status(200).json({ status: 'success', data: { conversations: formattedConversations } });
});

exports.getOrCreateConversation = asyncHandler(async (req, res) => {
  const { participantId } = req.params;

  const participant = await User.findById(participantId);
  if (!participant) throw new AppError('User not found.', 404);

  // Check if member trying to chat with non-trainer
  if (req.user.role === 'member' && participant.role === 'member') {
    throw new AppError('Members can only chat with trainers.', 403);
  }

  let conversation = await Conversation.findOne({
    type: 'direct',
    participants: { $all: [req.user._id, participantId], $size: 2 },
  }).populate('participants', 'name avatar role isActive');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, participantId],
      type: 'direct',
      unreadCounts: [
        { user: req.user._id, count: 0 },
        { user: participantId, count: 0 },
      ],
    });
    conversation = await conversation.populate('participants', 'name avatar role isActive');
  }

  res.status(200).json({ status: 'success', data: { conversation } });
});

exports.getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const conversation = await Conversation.findById(req.params.conversationId);
  if (!conversation) throw new AppError('Conversation not found.', 404);

  if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
    throw new AppError('Not authorized to view this conversation.', 403);
  }

  const totalMessages = conversation.messages.length;
  const start = Math.max(0, totalMessages - page * limit);
  const end = totalMessages - (page - 1) * limit;
  const messages = conversation.messages.slice(start, end);

  // Mark messages as read
  const updatedMessages = conversation.messages.map((msg) => {
    if (!msg.isRead && msg.sender.toString() !== req.user._id.toString()) {
      msg.isRead = true;
      msg.readAt = new Date();
    }
    return msg;
  });
  conversation.messages = updatedMessages;

  // Reset unread count for current user
  const unreadIdx = conversation.unreadCounts?.findIndex((u) => u.user.toString() === req.user._id.toString());
  if (unreadIdx > -1) conversation.unreadCounts[unreadIdx].count = 0;
  await conversation.save();

  res.status(200).json({
    status: 'success',
    data: {
      messages,
      hasMore: start > 0,
      total: totalMessages,
    },
  });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { content, type = 'text', workoutRef } = req.body;
  const { conversationId } = req.params;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found.', 404);

  if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
    throw new AppError('Not authorized to send messages in this conversation.', 403);
  }

  const message = {
    sender: req.user._id,
    content,
    type,
    ...(workoutRef && { workoutRef }),
  };

  conversation.messages.push(message);
  conversation.lastMessage = { content, sender: req.user._id, sentAt: new Date(), type };

  // Increment unread count for other participants
  conversation.participants.forEach((participantId) => {
    if (participantId.toString() !== req.user._id.toString()) {
      const idx = conversation.unreadCounts?.findIndex((u) => u.user.toString() === participantId.toString());
      if (idx > -1) conversation.unreadCounts[idx].count += 1;
      else conversation.unreadCounts.push({ user: participantId, count: 1 });
    }
  });

  await conversation.save();

  const newMessage = conversation.messages[conversation.messages.length - 1];

  // Emit via socket
  conversation.participants.forEach((participantId) => {
    if (participantId.toString() !== req.user._id.toString()) {
      req.io?.to(`user:${participantId}`).emit('message:new', {
        conversationId,
        message: { ...newMessage.toObject(), sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar } },
      });
    }
  });

  res.status(201).json({ status: 'success', data: { message: newMessage } });
});

exports.deleteMessage = asyncHandler(async (req, res) => {
  const { conversationId, messageId } = req.params;
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found.', 404);

  const message = conversation.messages.id(messageId);
  if (!message) throw new AppError('Message not found.', 404);
  if (message.sender.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this message.', 403);
  }

  message.isDeleted = true;
  message.content = 'This message was deleted';
  message.deletedAt = new Date();
  await conversation.save();

  res.status(200).json({ status: 'success', message: 'Message deleted.' });
});
