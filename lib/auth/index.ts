/**
 * AI Work Tracker - 用户认证模块
 */

import { getSupabaseClient } from '@lib/db-providers/supabase';
import { User, UserSession, AuthResponse } from '@lib/types';
import { createHash, randomBytes } from 'crypto';

// ==================== 密码处理 ====================

/**
 * 对密码进行哈希处理
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return `${salt}:${hash}`;
}

/**
 * 验证密码
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return hash === verifyHash;
}

/**
 * 生成会话 token
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// ==================== 用户管理 ====================

/**
 * 创建新用户
 */
export async function createUser(
  username: string,
  password: string,
  displayName?: string
): Promise<User> {
  const client = getSupabaseClient();
  
  // 检查用户名是否已存在
  const { data: existing } = await client
    .from('users')
    .select('id')
    .eq('username', username.toLowerCase())
    .single();

  if (existing) {
    throw new Error('用户名已存在');
  }

  const passwordHash = hashPassword(password);

  const { data, error } = await client
    .from('users')
    .insert({
      username: username.toLowerCase(),
      password_hash: passwordHash,
      display_name: displayName || username
    })
    .select('id, username, display_name, created_at, updated_at')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * 通过用户名获取用户
 */
export async function getUserByUsername(username: string): Promise<(User & { password_hash: string }) | null> {
  const client = getSupabaseClient();
  
  const { data } = await client
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  return data;
}

/**
 * 通过 ID 获取用户
 */
export async function getUserById(id: string): Promise<User | null> {
  const client = getSupabaseClient();
  
  const { data } = await client
    .from('users')
    .select('id, username, display_name, created_at, updated_at')
    .eq('id', id)
    .single();

  return data;
}

// ==================== 会话管理 ====================

/**
 * 创建用户会话
 */
export async function createUserSession(userId: string): Promise<UserSession> {
  const client = getSupabaseClient();
  const token = generateToken();
  
  // 会话有效期：7天
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await client
    .from('user_sessions')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * 验证会话 token
 */
export async function validateSession(token: string): Promise<User | null> {
  const client = getSupabaseClient();
  
  const { data: session } = await client
    .from('user_sessions')
    .select('*, user:users(id, username, display_name, created_at, updated_at)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!session || !session.user) return null;
  return session.user as User;
}

/**
 * 删除会话（登出）
 */
export async function deleteSession(token: string): Promise<void> {
  const client = getSupabaseClient();
  
  await client
    .from('user_sessions')
    .delete()
    .eq('token', token);
}

/**
 * 删除用户的所有会话
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  const client = getSupabaseClient();
  
  await client
    .from('user_sessions')
    .delete()
    .eq('user_id', userId);
}

// ==================== 认证流程 ====================

/**
 * 用户登录
 */
export async function login(username: string, password: string): Promise<AuthResponse> {
  const user = await getUserByUsername(username);
  
  if (!user) {
    throw new Error('用户名或密码错误');
  }

  if (!verifyPassword(password, user.password_hash)) {
    throw new Error('用户名或密码错误');
  }

  const session = await createUserSession(user.id);

  return {
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    token: session.token,
    expires_at: session.expires_at
  };
}

/**
 * 用户注册
 */
export async function register(
  username: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  // 验证用户名
  if (username.length < 3 || username.length > 50) {
    throw new Error('用户名长度必须在 3-50 个字符之间');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error('用户名只能包含字母、数字和下划线');
  }

  // 验证密码
  if (password.length < 6) {
    throw new Error('密码长度至少 6 个字符');
  }

  const user = await createUser(username, password, displayName);
  const session = await createUserSession(user.id);

  return {
    user,
    token: session.token,
    expires_at: session.expires_at
  };
}

/**
 * 用户登出
 */
export async function logout(token: string): Promise<void> {
  await deleteSession(token);
}

/**
 * 获取当前用户
 */
export async function getCurrentUser(token: string): Promise<User | null> {
  return validateSession(token);
}

