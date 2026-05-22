/**
 * Welcome to Cloudflare Workers! This is your first worker.
 */

import { createClient } from '@libsql/client/web';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

export default {
  async fetch(request, env) {
    // 1. Cấu hình CORS chuẩn cho mọi phản hồi
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", 
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Password, worker-url, worker-api",
    };
	const url = new URL(request.url)
  const secretKey = new TextEncoder().encode(env.JWT_SECRET);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // ==========================================
    // ROUTE: PHỤC VỤ HÌNH ẢNH TỪ R2 BUCKET
    // ==========================================
    if (url.pathname.startsWith('/images/') && request.method === 'GET') {
      try {
        const filename = url.pathname.replace('/images/', '');
        const object = await env.MY_BUCKET.get(filename);
        if (!object) {
          return new Response("Image not found ┐(￣～￣)┌", { 
            status: 404, 
            headers: corsHeaders 
          });
        }
        
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Cache-Control", "public, max-age=86400"); // Cache 1 ngày để tăng tốc tải trang
        
        return new Response(object.body, { headers });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          message: "Lỗi đọc ảnh từ R2: " + err.message
        }), { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
    }

    try {


    //===========================================
    // XỬ LÍ THÔNG TIN AUTH CỦA USER
    //===========================================


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
            .setIssuer(data.WORKER_URL || 'undefined')
            .setAudience(data.WEB_URL || 'undefined')
            .setExpirationTime('1h')
            .sign(secretKey);
                return new Response(JSON.stringify({
                  success: true,
                  message: "Đăng nhập thành công",
                  token: JWT_TOKEN,
                  avatar: existUser.avatar || null
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
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      try {
        const data = await request.json();
        const username = data.username;
        const password = data.password;

        if (!username || !password) {
          return new Response(JSON.stringify({
            success: false,
            message: "Vui lòng cung cấp đầy đủ thông tin"
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const client = createClient({ url: env.DB_URL, authToken: env.DB_TOKEN });
        const existingUser = await client.execute({
          sql: "SELECT * FROM users WHERE username = ?",
          args: [username]
        });

        if (existingUser.rows.length > 0) {
          return new Response(JSON.stringify({
            success: false,
            message: "Tài khoản đã tồn tại"
          }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await client.execute({
          sql: "INSERT INTO users (username, password_hash) VALUES (?, ?)",
          args: [username, hashedPassword]
        });

        return new Response(JSON.stringify({
          success: true,
          message: "Đăng ký thành công"
        }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: error.message
        }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }  

    // ==========================================
    // ROUTE: CẬP NHẬT AVATAR (Yêu cầu Token)
    // ==========================================
    if (url.pathname === '/api/users/update-avatar' && request.method === 'POST') {
      const authHeader = request.headers.get("Authorization") || "";
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({
          success: false,
          message: "Bạn chưa đăng nhập hoặc thiếu token xác thực!"
        }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const token = authHeader.replace("Bearer ", "");
      const secret = new TextEncoder().encode(env.JWT_SECRET);
      
      let verifiedPayload;
      try {
        const { payload } = await jwtVerify(token, secret);
        verifiedPayload = payload;
      } catch (jwtError) {
        return new Response(JSON.stringify({
          success: false,
          message: "Phiên đăng nhập đã hết hạn hoặc Token không hợp lệ! Vui lòng đăng nhập lại."
        }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      try {
        const data = await request.json();
        const avatar = data.avatar;
        const userId = verifiedPayload.userId;

        if (!avatar) {
          return new Response(JSON.stringify({
            success: false,
            message: "Thiếu dữ liệu ảnh đại diện!"
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        let avatarUrl = avatar;
        if (avatar.startsWith("data:image/")) {
          try {
            const filename = `${crypto.randomUUID()}_avatar.jpg`;
            const base64Data = avatar.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            await env.MY_BUCKET.put(filename, buffer, {
              httpMetadata: { contentType: "image/jpeg" }
            });
            
            const workerUrl = new URL(request.url).origin;
            avatarUrl = `${workerUrl}/images/${filename}`;
          } catch (uploadError) {
            console.error("Lỗi tải ảnh đại diện lên R2:", uploadError.message);
            // Fallback: Dùng Base64 nếu R2 lỗi hoặc chưa cấu hình
            avatarUrl = avatar;
          }
        }

        const client = createClient({ url: env.DB_URL, authToken: env.DB_TOKEN });
        await client.execute({
          sql: "UPDATE users SET avatar = ? WHERE id = ?",
          args: [avatarUrl, userId]
        });

        return new Response(JSON.stringify({
          success: true,
          message: "Cập nhật ảnh đại diện thành công!",
          avatar: avatarUrl
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: "Lỗi hệ thống: " + error.message
        }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

	// Xử lí đăng bài - chỉ cho phép user đã auth mới được đăng
	

      // ==========================================
      // ROUTE 3: LUỒNG ĐĂNG BÀI VIẾT (Yêu cầu Token)
      // ==========================================
      if (url.pathname.includes('/api/posts/create') && request.method === 'POST') {
        const authHeader = request.headers.get("Authorization") || "";
        
        // 1. Kiểm tra định dạng Header
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({
            success: false,
            message: "Bạn chưa đăng nhập hoặc thiếu token xác thực!"
          }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        
        const token = authHeader.replace("Bearer ", "");
        const secret = new TextEncoder().encode(env.JWT_SECRET);
        
        let verifiedPayload;
        try {
          // 2. Tiến hành GIẢI MÃ và THẨM ĐỊNH Token
          // Nếu token giả hoặc hết hạn, hàm này sẽ ném ra lỗi lập tức nhảy xuống catch
          const { payload } = await jwtVerify(token, secret);
          verifiedPayload = payload; // Lấy được két sắt thông tin chứa: userId, username, role
          
        } catch (jwtError) {
          // Trả về lỗi 401 nếu token không hợp lệ, chặn đứng không cho xuống DB
          return new Response(JSON.stringify({
            success: false,
            message: "Phiên đăng nhập đã hết hạn hoặc Token không hợp lệ! Vui lòng đăng nhập lại."
          }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 3. Token HỢP LỆ -> Tiến hành xử lý dữ liệu bài viết
        const data = await request.json();
        
        // ĐỈNH CAO BẢO MẬT: Lấy thẳng username từ token đã xác thực chứ không tin Frontend gửi lên nữa!
        const author = verifiedPayload.username; 
        const avatar = data.avatar || null;
        
        let finalContent = data.content || data.text || "";
        const image = data.image || null;
        
        if (image) {
          if (image.startsWith("data:image/")) {
            try {
              const filename = `${crypto.randomUUID()}.jpg`;
              const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
              const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              
              await env.MY_BUCKET.put(filename, buffer, {
                httpMetadata: { contentType: "image/jpeg" }
              });
              
              const workerUrl = new URL(request.url).origin;
              const imageUrl = `${workerUrl}/images/${filename}`;
              finalContent += `<br><img src="${imageUrl}" class="post-uploaded-image">`;
            } catch (uploadError) {
              console.error("Lỗi tải ảnh bài viết lên R2:", uploadError.message);
              // Fallback: Nếu R2 lỗi hoặc chưa thiết lập, vẫn dùng Base64 để tránh gián đoạn
              finalContent += `<br><img src="${image}" class="post-uploaded-image">`;
            }
          } else {
            // Nếu gửi sẵn link ảnh thô
            finalContent += `<br><img src="${image}" class="post-uploaded-image">`;
          }
        }

        const client = createClient({ url: env.DB_URL, authToken: env.DB_TOKEN });
        await client.execute({
          sql: "INSERT INTO posts (author, content, avatar) VALUES (?, ?, ?)",
          args: [author, finalContent, avatar]
        });

        return new Response(JSON.stringify({
          success: true,
          message: "Đăng bài thành công dưới tư cách: " + author,
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

        const client = createClient({ url: env.DB_URL, authToken: env.DB_TOKEN });
        await client.execute({
          sql: "DELETE FROM posts WHERE id = ?",
          args: [postId]
        });

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