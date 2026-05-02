#!/bin/bash
# Kịch bản Auto-Deploy trang web Anime của Ethan

WORKSPACE="/home/cloudadmin/CloudTesting"
WEB_ROOT="/var/www/mycloud"

echo "🌸 Bắt đầu quá trình cập nhật trang web..."

# Tạo Showroom (nếu chưa có)
sudo mkdir -p $WEB_ROOT

# Chép file HTML ra Showroom và đổi tên
echo "📦 Đang chuyển HTML..."
sudo cp $WORKSPACE/test_db.html $WEB_ROOT/index.html

# Chép toàn bộ thư mục img ra Showroom
echo "🖼️ Đang chuyển thư mục hình ảnh..."
sudo cp -r $WORKSPACE/imgs $WEB_ROOT/

# Lấy giờ hệ thống và dùng SED để cấy vào HTML
CURRENT_TIME=$(date '+%H:%M:%S ngày %d-%m-%Y')
echo "🕒 Đang cấy mốc thời gian ($CURRENT_TIME) vào bài viết..."
sudo sed -i "s/Vừa đăng/Tự động deploy lúc: $CURRENT_TIME/g" $WEB_ROOT/index.html

# Cấp quyền cho Nginx
echo "🔐 Đang cấu hình bảo mật file..."
sudo chown -R www-data:www-data $WEB_ROOT
sudo chmod -R 755 $WEB_ROOT

# Reload Nginx
echo "🚀 Đang reload Nginx..."
sudo systemctl reload nginx

echo "✨ Hoàn tất! Hãy ra trình duyệt ấn F5 để tận hưởng!"
