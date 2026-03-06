import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Генерация случайного пароля
function generatePassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Генерация логина из ФИО
function generateLogin(fullName: string): string {
  const parts = fullName.trim().toLowerCase().split(' ');
  if (parts.length >= 2) {
    // Фамилия + первая буква имени
    const surname = parts[0].replace(/[^a-zа-яё]/gi, '');
    const firstInitial = parts[1].charAt(0);
    return `${surname}${firstInitial}`;
  }
  return fullName.replace(/[^a-zа-яё]/gi, '').toLowerCase();
}

// Получить всех пользователей
app.get('/users', async (c) => {
  try {
    const users = await kv.getByPrefix('user:');
    return c.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Создать нового пользователя
app.post('/users', async (c) => {
  try {
    const body = await c.req.json();
    const { full_name, email, role, created_by } = body;

    if (!full_name || !email || !role) {
      return c.json({ error: 'Missing required fields: full_name, email, role' }, 400);
    }

    // Генерируем логин и пароль
    const login = generateLogin(full_name);
    const password = generatePassword();
    const userEmail = email.toLowerCase();

    // Создаем пользователя в Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: password,
      email_confirm: true, // Автоматически подтверждаем email
      user_metadata: {
        full_name,
        role,
        login,
      },
    });

    if (authError) {
      console.error('Error creating user in Supabase Auth:', authError);
      return c.json({ error: `Failed to create user: ${authError.message}` }, 500);
    }

    const userId = authData.user?.id;
    if (!userId) {
      return c.json({ error: 'User ID not returned from Supabase' }, 500);
    }

    // Сохраняем дополнительные данные пользователя в KV store
    const user = {
      id: userId,
      email: userEmail,
      full_name,
      role,
      login,
      created_at: new Date().toISOString(),
      created_by,
    };

    await kv.set(`user:${userId}`, user);

    // В реальной системе здесь отправлялось бы письмо на почту
    // Для демонстрации возвращаем учетные данные в ответе
    return c.json({
      user,
      credentials: {
        login,
        email: userEmail,
        password,
      },
      message: 'User created successfully. In production, credentials would be sent via email.',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ error: `Failed to create user: ${error.message}` }, 500);
  }
});

// Обновить роль пользователя
app.put('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const body = await c.req.json();
    const { role, full_name } = body;

    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Обновляем данные пользователя
    const updatedUser = {
      ...user,
      ...(role && { role }),
      ...(full_name && { full_name }),
    };

    await kv.set(`user:${userId}`, updatedUser);

    // Обновляем metadata в Supabase Auth
    if (role || full_name) {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...(role && { role }),
          ...(full_name && { full_name }),
        },
      });
    }

    return c.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: `Failed to update user: ${error.message}` }, 500);
  }
});

// Удалить пользователя
app.delete('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');

    // Удаляем из Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Error deleting user from Supabase Auth:', authError);
      return c.json({ error: `Failed to delete user: ${authError.message}` }, 500);
    }

    // Удаляем из KV store
    await kv.del(`user:${userId}`);

    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: `Failed to delete user: ${error.message}` }, 500);
  }
});

// Сбросить пароль пользователя (отправить новый пароль на email)
app.post('/users/:id/reset-password', async (c) => {
  try {
    const userId = c.req.param('id');

    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Генерируем новый пароль
    const newPassword = generatePassword();

    // Обновляем пароль в Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (authError) {
      console.error('Error resetting password:', authError);
      return c.json({ error: `Failed to reset password: ${authError.message}` }, 500);
    }

    // В реальной системе здесь отправлялось бы письмо на почту
    return c.json({
      message: 'Password reset successfully',
      credentials: {
        email: user.email,
        password: newPassword,
      },
      note: 'In production, new password would be sent via email.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return c.json({ error: `Failed to reset password: ${error.message}` }, 500);
  }
});

export default app;
