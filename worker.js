import { createClient } from '@libsql/client/web';
import bcrypt from 'bcryptjs';

export default {
  async fetch(request, env) {
    // 1. Cấu hình CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", 
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Password",
    };
    // XỬ LÍ THÔNG TIN ĐĂNG NHẬPAUTH CỦA USER
      //LUỒNG ĐĂNG NHẬP
    if(request.pathname === '/api/auth/login' && request.method === 'POST')
    {
      try{
<<<<<<< HEAD
        data = await request.json();
=======
        const data = await request.json();
>>>>>>> b953c23e29835fa4a3bbb7d4cbcfb40a892ead7a
        const username = data.username;
        const password = data.password;

        const client = createClient({
          url: env.DB_URL,
          authToken: env.DB_TOKEN
        })
<<<<<<< HEAD
        const queryResult = client.execute({
=======
        const queryResult = await client.execute({
>>>>>>> b953c23e29835fa4a3bbb7d4cbcfb40a892ead7a
          sql: "SELECT * FROM users WHERE username = ?",
          args: [username]
        })

        if(queryResult.rows.length === 0)
        {
          return new Response(JSON.stringify({
            success: false,
            message: "Tài khoản không tồn tại ┐(￣～￣)┌",
<<<<<<< HEAD
          }) {status: 401, headers: {"Content-Type": "application/json"}})
=======
          }), {status: 401, headers: {"Content-Type": "application/json"}})
>>>>>>> b953c23e29835fa4a3bbb7d4cbcfb40a892ead7a
        }

        const existUser = queryResult.rows[0];
        const hashedPassword = existUser.password_hash;
        const isMatch = await bcrypt.compare(password, hashedPassword);

        if(isMatch)
        {
          return new Response(JSON.stringify({
            success: true,
            message: "Đăng nhập thành công",
<<<<<<< HEAD
          }) {headers: {"Content-Type": "application/json"}})
=======
            token: JWT_TOKEN,
          }), {headers: {"Content-Type": "application/json"}})
>>>>>>> b953c23e29835fa4a3bbb7d4cbcfb40a892ead7a
        }
        
        return new Response(JSON.stringify({
            success: false,
            message: "Mật khẩu sai rồi",
<<<<<<< HEAD
          }) {status: 401, headers: {"Content-Type": "application/json"}})
=======
          }), {status: 401, headers: {"Content-Type": "application/json"}})
>>>>>>> b953c23e29835fa4a3bbb7d4cbcfb40a892ead7a

        }catch(error)
        {
          return new Response(JSON.stringify({
            success: true,
            message: error.message,
<<<<<<< HEAD
          }) {status: 500, headers: {"Content-Type": "application/json"}})
=======
          }), {status: 500, headers: {"Content-Type": "application/json"}})
>>>>>>> b953c23e29835fa4a3bbb7d4cbcfb40a892ead7a
        }
    }

    // 2. Xử lý pre-flight request
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);

      // ====================================================================
      // LUỒNG 1: TRẠM HẢI QUAN - CHỈ XỬ LÝ LỆNH XÓA (DELETE)
      // ====================================================================
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
                // ĐIỂM SỬA SỐ 1: Bọc String() quanh postId để chiều lòng Turso
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

        // ĐIỂM SỬA SỐ 2: Bắt Worker phải đọc phản hồi của Turso
        if (!tursoResponse.ok) {
           const errorText = await tursoResponse.text(); // Lấy lời nhắn lỗi của Turso
           return new Response(JSON.stringify({ error: "Turso từ chối xóa: " + errorText }), { 
             status: 500, 
             headers: corsHeaders 
           });
        }

        // Chỉ khi Turso thực sự OK thì mới báo cho Frontend đập vỡ kính
        return new Response(JSON.stringify({ success: true }), { 
          status: 200, 
          headers: corsHeaders 
        });
      }

      // ====================================================================
      // LUỒNG 2: GIAO LIÊN MÙ - XỬ LÝ CÁC LỆNH KHÁC (ĐĂNG BÀI, TẢI BÀI...)
      // ====================================================================
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
      return new Response("Lỗi Worker: " + err.message, { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};
