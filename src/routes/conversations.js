import express from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Listar conversas
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', req.user.userId);

    if (error) throw error;

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
});

// Criar nova conversa
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert([
        {
          user_id: req.user.userId,
          status: 'open'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
});

// Obter conversa específica
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
});

export const conversationRoutes = router; 