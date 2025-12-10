/**
 * Cookie 工具函数
 * 替代 'cookie' npm 包
 */

export interface CookieSerializeOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none' | boolean;
  path?: string;
  maxAge?: number;
  expires?: Date;
  domain?: string;
}

/**
 * 解析 cookie 字符串为对象
 */
export function parse(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name) {
      const value = rest.join('=');
      try {
        cookies[name.trim()] = decodeURIComponent(value.trim());
      } catch {
        cookies[name.trim()] = value.trim();
      }
    }
  });

  return cookies;
}

/**
 * 序列化 cookie 为字符串
 */
export function serialize(name: string, value: string, options: CookieSerializeOptions = {}): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.maxAge !== undefined) {
    cookie += `; Max-Age=${Math.floor(options.maxAge)}`;
  }

  if (options.expires) {
    cookie += `; Expires=${options.expires.toUTCString()}`;
  }

  if (options.path) {
    cookie += `; Path=${options.path}`;
  }

  if (options.domain) {
    cookie += `; Domain=${options.domain}`;
  }

  if (options.secure) {
    cookie += '; Secure';
  }

  if (options.httpOnly) {
    cookie += '; HttpOnly';
  }

  if (options.sameSite) {
    const sameSiteValue = typeof options.sameSite === 'string' 
      ? options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1).toLowerCase()
      : 'Strict';
    cookie += `; SameSite=${sameSiteValue}`;
  }

  return cookie;
}
