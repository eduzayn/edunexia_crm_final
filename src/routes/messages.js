import express from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Listar mensagens de uma conversa
router.get('/conversation/:conversationId', authMiddleware, async (req, res, next) => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
});

// Enviar nova mensagem
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { conversation_id, content } = req.body;

    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id,
          user_id: req.user.userId,
          content,
          message_type: 'outgoing'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
});

// Marcar mensagens como lidas
router.put('/read/:conversationId', authMiddleware, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', req.params.conversationId)
      .eq('read', false)
      .neq('user_id', req.user.userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas'
    });
  } catch (error) {
    next(error);
  }
});

export const messageRoutes = router; 