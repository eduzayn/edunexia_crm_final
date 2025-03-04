import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_API_KEY
);

// Listar contatos
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', req.user.userId);

    if (error) throw error;

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
});

// Criar novo contato
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    const { data: contact, error } = await supabase
      .from('contacts')
      .insert([
        {
          user_id: req.user.userId,
          name,
          email,
          phone
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar contato
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    const { data: contact, error } = await supabase
      .from('contacts')
      .update({
        name,
        email,
        phone
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
});

// Excluir contato
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Contato excluído com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

export const contactRoutes = router; 