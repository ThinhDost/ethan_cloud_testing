/**
 * Welcome to Cloudflare Workers! This is your first worker.
 */

import { createClient } from '@libsql/client/web';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export default {
  async fetch(request, env) {
    // 1. Cấu hình CORS chuẩn cho mọi phản hồi
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", 
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Password",
    };
	const url = new URL(request.url)
  const secretKey = new TextEncoder().encode(env.JWT_SECRET);
    try {
    // XỬ LÍ THÔNG TIN AUTH CỦA USER
      //LUỒNG ĐĂNG NHẬP
    if(url.pathname === '/api/auth/login' && request.method === 'POST')
    {
      try
      {
        const data = await request.json();
        const username = data.username;
        const password = data.password;

        const client = createClient({ url: env.DB_URL, authToken: env.DB_TOKEN });
        const queryResult = await client.execute({
          sql: "SELECT * FROM users WHERE username = ?",
          args: [username]
        });

        if (queryResult.rows.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            message: "Tài khoản không tồn tại ┐(￣～￣)┌",
          }), {status: 401, headers: {...corsHeaders,"Content-Type": "application/json"}})
        }

        const existUser = queryResult.rows[0];
        const hashedPassword = existUser.password_hash;

        if(!hashedPassword)
        {
          return new Response(JSON.stringify({
            success: false,
            message: "Tài khoản không tồn tại ┐(￣～￣)┌",
          }), {status: 500, headers: {...corsHeaders,"Content-Type": "application/json"}})
        }

        const isMatch = await bcrypt.compare(password, hashedPassword);

        if(isMatch)
        {
          const userPayload = {
            userId: existUser.id,
            username: existUser.username,
            role: existUser.role || "user"
          };
          const JWT_TOKEN = await new SignJWT(userPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('2h')
            .sign(secretKey);
                return new Response(JSON.stringify({
                  success: true,
                  message: "Đăng nhập thành công",
                  token: JWT_TOKEN,
                }), {headers: {...corsHeaders, "Content-Type": "application/json"}})
        }
        
        else return new Response(JSON.stringify({
              success: false,
              message: "Mật khẩu sai rồi",
            }), {status: 401, headers: {...corsHeaders, "Content-Type": "application/json"}})

      }catch(error)
          {
            return new Response(JSON.stringify({
              success: false,
              message: error.message,
            }), {status: 500, headers: {...corsHeaders, "Content-Type": "application/json"}})
          }
        }
	// Xử lí đăng bài - chỉ cho phép user đã auth mới được đăng
	

      // ==========================================
      // ROUTE 3: LUỒNG ĐĂNG BÀI VIẾT (Yêu cầu Token)
      // ==========================================
      if (url.pathname === '/api/posts/create' && request.method === 'POST') {
        const authHeader = request.headers.get("Authorization") || "";
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            success: false,
            message: "Thiếu token đăng nhập"
          }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const token = authHeader.replace("Bearer ", "");
        const secret = new TextEncoder().encode(env.JWT_SECRET);

        // Lưu ý xử lý kiểm tra Verify Token của thư viện jose ở đây nếu cần thiết giống code cũ của bạn
        
        const data = await request.json();
        const author = data.author;
        let finalContent = data.text;
        const image = data.image || null;
        if (image) finalContent += `<br><img src="${image}" class="post-uploaded-image">`;

        const client = createClient({ url: env.DB_URL, authToken: env.DB_TOKEN });
        await client.execute({
          sql: "INSERT INTO posts (author, content) VALUES (?, ?)",
          args: [author, finalContent]
        });

        return new Response(JSON.stringify({
          success: true,
          message: "Đăng bài thành công",
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ==========================================
      // ROUTE 4: LUỒNG XÓA BÀI (DELETE)
      // ==========================================
      if (request.method === "DELETE") {
        const clientPass = request.headers.get("X-Admin-Password");

        if (clientPass !== env.DEL_POST_PW) {
          return new Response(JSON.stringify({ error: "Sai mật khẩu Admin!" }), { 
            status: 401, 
            headers: corsHeaders 
          });
        }

        const requestBody = await request.json();
        const postId = requestBody.postId;

        const tursoDeleteUrl = `${env.DB_URL}/v2/pipeline`;
        const tursoPayload = {
          requests: [
            {
              type: "execute",
              stmt: {
                sql: "DELETE FROM posts WHERE id = ?",
                args: [{ type: "integer", value: String(postId) }] 
              }
            },
            { type: "close" }
          ]
        };

        const tursoResponse = await fetch(tursoDeleteUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.DB_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(tursoPayload)
        });

        if (!tursoResponse.ok) {
           const errorText = await tursoResponse.text();
           return new Response(JSON.stringify({ error: "Turso từ chối xóa: " + errorText }), { 
             status: 500, 
             headers: corsHeaders 
           });
        }

        return new Response(JSON.stringify({ success: true }), { 
          status: 200, 
          headers: corsHeaders 
        });
      }

      // ==========================================
      // ROUTE MẶC ĐỊNH: GIAO LIÊN MÙ (CHỈ CHẠY KHI KHÔNG KHỚP ROUTE NÀO Ở TRÊN)
      // Dùng để lấy danh sách bài viết (GET /v2/pipeline hoặc các api của Turso)
      // ==========================================
      const targetUrl = `${env.DB_URL}${url.pathname}${url.search}`;

      const modifiedRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      modifiedRequest.headers.set("Authorization", `Bearer ${env.DB_TOKEN}`);

      const response = await fetch(modifiedRequest);
      const modifiedResponse = new Response(response.body, response);
      
      Object.keys(corsHeaders).forEach(key => {
        modifiedResponse.headers.set(key, corsHeaders[key]);
      });

      return modifiedResponse;

    } catch (err) {
      // Bất kỳ lỗi phát sinh ở route nào cũng sẽ được tóm gọn tại đây và xuất ra thông báo tường minh
      return new Response(JSON.stringify({
        success: false,
        message: "Lỗi hệ thống Worker: " + err.message
      }), { 
        status: 500, 
        headers: corsHeaders,
        "Content-Type": "application/json"
      });
    }
  }
};