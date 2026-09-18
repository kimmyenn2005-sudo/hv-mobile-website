# Website HV Mobile – GitHub + trang quản trị

Phiên bản này giữ nguyên các trang HTML hiện có và bổ sung quy trình xuất bản bài SEO tự động.

## Chức năng đã thêm

- Trang công khai `/bai-viet/`.
- Trang quản trị `/admin/` dùng Decap CMS.
- Quản trị giá bán iPhone, giá thu cũ, giá phụ kiện và giá sửa chữa ngay trong `/admin/`.
- Nội dung bài viết lưu trong `content/posts/` để có lịch sử phiên bản trên GitHub.
- Tự tạo URL riêng, thẻ SEO, Open Graph và schema `BlogPosting` cho mỗi bài.
- Tự cập nhật `sitemap.xml` và `feed.xml` sau mỗi lần xuất bản.
- Tự động deploy từ GitHub qua Netlify.
- Bài nháp có `draft: true` sẽ không xuất hiện cho khách hoặc Google.
- Một nút Zalo tư vấn đồng bộ ở góc phải dưới trên mọi trang.
- Bấm từng mẫu iPhone để xem ảnh, màu, dung lượng, tình trạng, giá và thông số chi tiết.
- Footer giữ nguyên cùng một thiết kế và nội dung trên toàn website.

## Chạy thử trên máy

Yêu cầu Node.js 22 trở lên.

```bash
npm run build
npm run check
npm run dev
```

Mở `http://127.0.0.1:8080`.

## Biến môi trường Netlify

| Tên | Ví dụ | Bắt buộc |
| --- | --- | --- |
| `CMS_REPO` | `kimmyenn2005-sudo/iphonequangngai` | Có, để đăng nhập và xuất bản |
| `SITE_URL` | `https://iphonequangngai.hvmobile43-vn.workers.dev` | Nên đặt |

Chi tiết thao tác dành cho chủ website nằm trong `HUONG-DAN-DANG-BAI.txt`.

## Xác thực trang quản trị

CMS dùng GitHub backend trực tiếp. Mỗi người đăng bài phải đăng nhập GitHub và có quyền ghi vào kho mã. Cấu hình OAuth thực hiện trong Netlify theo hướng dẫn chính thức; không lưu Client Secret trong kho mã.
