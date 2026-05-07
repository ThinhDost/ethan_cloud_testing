export default {
  async fetch(request, env) {
    // 1. Cấu hình CORS
    const allowed_origin = "https://ethan-cloud-testing.pages.dev/";
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowed_origin,
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", 
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Password",
    };
    
    const tursoUrl = `${env.DB_URL}${url.pathname}${url.search}`;
    // 2. Xử lý pre-flight request
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
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

            const tursoPayload_DEL = {
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

            const tursoResponse_DEL = await fetch(tursoUrl, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${env.DB_TOKEN}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(tursoPayload_DEL)
            });

            // ĐIỂM SỬA SỐ 2: Bắt Worker phải đọc phản hồi của Turso
            if (!tursoResponse_DEL.ok) {
              const errorText = await tursoResponse_DEL.text(); // Lấy lời nhắn lỗi của Turso
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

          if (request.method === "GET")
          {
              const tursoPayload_GET = {
                requests: [
                  {
                      type: "execute",
                      stmt: {
                          sql: "SELECT * FROM posts ORDER BY id DESC",
                          args: []
                      }
                  },
                  { type: "close" }
                ]
              };
              const tursoResponse_GET = await fetch(tursoUrl, {
                method: "POST",
              headers: {
                "Authorization": `Bearer ${env.DB_TOKEN}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(tursoPayload_GET)
              });
              

              if(!tursoResponse_GET.ok)
              {
                const errorText_get = await tursoResponse_GET.text(); // Lấy lời nhắn lỗi của Turso
                return new Response(JSON.stringify({ error: "Turso từ chối gửi data: " + errorText_get }), { 
                status: 500, 
                headers: corsHeaders 
              });
              }

              const turso_data_get = await tursoResponse_GET.json();
              const result_get = new Response(JSON.stringify(turso_data_get), {
                status: 200,
                headers: corsHeaders
              });

              return result_get;
          }

          if (request.method === "POST")
          {
            const data_post = await request.json(); 
            const author = data_post.author;
            const content = data_post.content;

            const tursoPayload_POST = {
                requests: [
                  {
                      type: "execute",
                      stmt: {
                          sql: "INSERT INTO posts (author, content) VALUES (?, ?)",
                          args: [
                              { type: "text", value: String(author) },
                              { type: "text", value: String(content) }
                          ]
                      }
                  },
                  { type: "close" }
                ]
              };

              const tursoResponse_POST = await fetch(tursoUrl, {
                method: "POST",
              headers: {
                "Authorization": `Bearer ${env.DB_TOKEN}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(tursoPayload_POST)
              });

              if(!tursoResponse_POST.ok)
              {
                const errorText_post = await tursoResponse_POST.text(); // Lấy lời nhắn lỗi của Turso
                return new Response(JSON.stringify({ error: "Turso từ chối cập nhật data: " + errorText_post }), { 
                status: 500, 
                headers: corsHeaders 
              });
              }

              const result_post = new Response(JSON.stringify("Gửi data lên DB thành công"), {
                status: 200,
                headers: corsHeaders
              });

              return result_post;
          }

          /* ====================================================================
          // LUỒNG 2: GIAO LIÊN MÙ - XỬ LÝ CÁC LỆNH KHÁC (ĐĂNG BÀI, TẢI BÀI...)
          // ====================================================================
          const targetUrl = `${env.DB_URL}${url.pathname}${url.search}`;

          const modifiedRequest = new Request(tursoUrl, {
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

          return modifiedResponse;*/

        } catch (err) {
          return new Response("Lỗi Worker: " + err.message, { 
            status: 500, 
            headers: corsHeaders 
          });
        }
  }
};