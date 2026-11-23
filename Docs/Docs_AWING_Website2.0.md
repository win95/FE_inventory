# AWING Website 2\.0 – Tài liệu phát triển sản phẩm

# AWING Website 2\.0 – Tài liệu phát triển sản phẩm

Nov 12, 2026 · @M

## 1\. Tổng quan

AWING Website 2\.0 biến awing\.vn từ trang giới thiệu kênh Wi\-Fi marketing thành cổng sản phẩm, dữ liệu và tạo lead cho 6 sản phẩm của AWING, triển khai trong khoảng 10 tháng qua 4 đợt phát hành \(R1–R4\)\.

### Bối cảnh

Website hiện tại \(Next\.js \+ Strapi\) định vị AWING là "Mobile Location\-Based Marketing" và chia nội dung theo đối tượng \(Advertisers, Wi\-Fi Partners, Wi\-Fi Users\)\. Định vị mới là "Connecting Brands with Real\-World Consumer Moments" với 6 sản phẩm: Location\-Based Channel, Retail Media \& Activation, Measurement, Insights, Network và Ads Manager\. Website cũng cần chuẩn bị cho đa ngôn ngữ, đa thị trường \(Indonesia trước\)\.

### Mục tiêu

|\#|Mục tiêu|Thước đo chính|
|---|---|---|
|1|Tăng lead B2B có chất lượng|Lead đã xác thực email / tháng|
|2|Dùng dữ liệu mạng lưới làm lợi thế cạnh tranh|Lượt dùng Data Explorer, tỷ lệ mở khoá dữ liệu|
|3|Chuyển khách tiềm năng thành tài khoản và khách hàng|Tỷ lệ lead → tài khoản → khách hàng|
|4|Tăng truy cập tự nhiên, sẵn sàng đa thị trường|Organic traffic, số thị trường đã ra mắt|

### Phạm vi

- **Trong phạm vi:** toàn bộ website công khai \(awing\.vn, awing\.global\), trang dữ liệu công khai, lead form, tài khoản khách tiềm năng, cổng chuyển sang ACM/AAP, CMS, tìm kiếm, đo lường\.

- **Ngoài phạm vi:** thay đổi chức năng bên trong ACM/AAP, hệ thống quảng cáo captive portal, dashboard nội bộ \(Power BI\)\.

### Cách dùng tài liệu

|Vai trò|Đọc kỹ|Đọc lướt|
|---|---|---|
|PM / BA|2, 4, 5, 6, 9, 10|7, 8|
|Designer|2, 4, 5, 7|6, 9|
|Developer|3, 6, 8, 9|4, 5, 7|

Mỗi yêu cầu có mã \(ví dụ HOME\-01, DATA\-03\) để dùng trong backlog và thiết kế\. Các điểm chưa chốt nằm ở mục 10\.

## 2\. Quyết định đã chốt

Các quyết định dưới đây là đầu vào cố định cho thiết kế và phát triển; muốn thay đổi phải qua PM\.

|Mã|Chủ đề|Quyết định|
|---|---|---|
|D\-01|Logo|Bản **đỏ** là bản chính\. Bộ logo gồm biểu tượng "A" và wordmark AWING, mỗi loại có bản đỏ, xanh, xám và trắng\. File gốc: AWI\_Logo\_RGB\.ai \(11 artboard\)|
|D\-02|Màu|Giao diện chung dùng nền trung tính, đỏ cho logo và CTA chính\. Mỗi sản phẩm dùng màu riêng theo bảng màu 6 sản phẩm đã chốt \(quy tắc 80/20\)|
|D\-03|Product / Solution|6 Product, 26 Solution \(mục con của từng sản phẩm\)\. Các định dạng quảng cáo \(Bumper, Banner, TVC\.\.\.\) nằm trong Solution "Interactive Ad Experiences"|
|D\-04|Domain|awing\.vn cho Việt Nam \(/vi, /en\); awing\.global cho trang tổng và các thị trường mới \(/en, /id, /th\.\.\.\)\. Một codebase, hreflang chéo domain|
|D\-05|Tài khoản|2 loại: khách hàng hiện hữu \(AWING admin cấp, phân quyền theo workspace, dùng ACM/AAP\) và khách hàng tiềm năng \(tự đăng ký, chỉ lưu lịch sử, bộ lọc, tài liệu đã xem\)|
|D\-06|Lead form|Bắt buộc: email, số điện thoại, họ tên, công ty\. Tuỳ chọn: ngành, tên thương hiệu, khu vực, ghi chú\. Lead form là điều kiện để nhận dữ liệu chuyên sâu và là bước đầu của đăng ký tài khoản|
|D\-07|Dữ liệu công khai|Cập nhật hàng ngày\. 3 tầng truy cập: Khách, Lead, Tài khoản\. Không công khai doanh thu, tên khách hàng kèm doanh thu, toạ độ thô|
|D\-08|Tham khảo|Cloudflare Radar cho Data; VPS cho Home; economysea\.withgoogle\.com cho Home, Data, Insights, Resources\. File AWING\_Network\_Final\.html chỉ tham khảo phạm vi dữ liệu, không tham khảo kỹ thuật hay UI|
|D\-09|Nền tảng|Giữ Next\.js \+ Strapi, nâng cấp và mở rộng thay vì làm lại từ đầu|

## 3\. Hiện trạng awing\.vn

Nền tảng còn dùng được, nhưng có 2 lỗi SEO nghiêm trọng phải sửa ngay trong tuần đầu, trước mọi việc khác\. Khảo sát ngày 10/11/2026 trên trang công khai; chưa chạy Lighthouse, chưa xem mã nguồn hay GA4\.

**Công nghệ:** Next\.js \(App Router\), Strapi tại admin\.awing\.global, GA4 qua gtag\. Sitemap có 572 URL, trong đó 118 bài tin và 12 FAQ\. Menu hiện tại: Platform · Advertisers · Wi\-Fi Partners · Wi\-Fi Users · About Us · News\.

|Mã|Vấn đề|Mức độ|Cách sửa|
|---|---|---|---|
|FIX\-01|robots\.txt và sitemap\.xml trỏ sang domain staging awing\-website\-v2\.lotusa\.net|Nghiêm trọng|Đặt SITE\_URL=https://awing\.vn, build lại sitemap, submit lại trên Search Console; chặn index staging|
|FIX\-02|Canonical của mọi trang đều trỏ về https://awing\.vn|Nghiêm trọng|Canonical trỏ về chính URL của trang|
|FIX\-03|Trang /vi khai báo lang="en", title sai \("Dành cho Nhà quảng cáo – Case studies"\)|Cao|lang và metadata theo locale|
|FIX\-04|Không có hreflang|Cao|Thêm vi, en, x\-default|
|FIX\-05|Trang chủ có 4 H1; không có JSON\-LD; 8 ảnh thiếu alt|Trung bình|Một H1 mỗi trang; schema Organization, WebSite|
|FIX\-06|Trang chủ tải \~3,6 MB / 79 request, load \~4,4 giây \(đo một lần\)|Trung bình|Đo lại bằng Lighthouse; tối ưu ảnh, JS|
|FIX\-07|Khối "Latest From AWING" kẹt ở "Loading\.\.\."|Trung bình|Render phía server \(ISR\)|
|FIX\-08|/search, /events, /resources trả 404|Thông tin|Xây mới theo mục 5|

**Đối chiếu với phạm vi mới:** 6 hạng mục xây mới \(Data, Sign in/up, Search, Resources, Events, Product\), 8 hạng mục nâng cấp \(Home, Lead form, Footer, Menu, Social, Solution, About, Careers\), 1 giữ nguyên \(News\)\.

## 4\. Kiến trúc thông tin

Menu mới có 4 nhóm \(Products, Data, Insights \& Resources, Company\) cộng thanh công cụ, thay cho cách chia theo đối tượng; toàn bộ URL cũ được 301 redirect\.

### 4\.1 Header

\[Logo\] Products ▾ \| Data ▾ \| Insights \& Resources ▾ \| Company ▾ \| 🔍 \| VI/EN \| Sign in \| \[Get data\]

- **Products:** mega menu 6 cột, mỗi cột mang màu sản phẩm, liệt kê các Solution bên dưới\.

- **Data:** Overview, Explorer, Heatmap, Methodology\.

- **Insights \& Resources:** Reports, Papers, Case studies, Events, News\.

- **Company:** About, Partners, Customers, Investors, Careers, Contact\.

- **Thanh công cụ:** Search \(mở lớp phủ\), chọn ngôn ngữ, Sign in \(2 lựa chọn: Khách hàng AWING / Tài khoản website\), CTA "Get data" mở lead form\.

- **Mobile:** menu dạng ngăn kéo, CTA cố định ở cuối màn hình\.

### 4\.2 Danh sách trang và URL \(awing\.vn, tiền tố /vi hoặc /en\)

|Nhóm|Trang|URL|Template|
|---|---|---|---|
|Home|Trang chủ|/|T\-Home|
|Products|Danh sách 6 sản phẩm|/products|T\-ProductList|
|Products|Chi tiết sản phẩm \(6\)|/products/\{product\}|T\-ProductDetail|
|Products|Chi tiết Solution \(26\)|/products/\{product\}/\{solution\}|T\-SolutionDetail|
|Data|Tổng quan \(snapshot\)|/data|T\-DataOverview|
|Data|Explorer|/data/explorer|T\-DataExplorer|
|Data|Heatmap|/data/heatmap|T\-DataMap|
|Data|Phương pháp|/data/methodology|T\-Article|
|Resources|Hub tài liệu|/resources|T\-ResourceHub|
|Resources|Report / Paper / Case study|/resources/\{type\}/\{slug\}|T\-ReportStory / T\-Article|
|Events|Danh sách, chi tiết|/events, /events/\{slug\}|T\-EventList / T\-EventDetail|
|News|Danh sách, chi tiết|/news, /news/\{slug\}|T\-List / T\-Article|
|Company|About, Partners, Customers, Investors|/about, /about/partners, /about/customers, /about/investors|T\-Page|
|Company|Tuyển dụng|/careers, /careers/\{slug\}|T\-JobList / T\-JobDetail|
|Company|Liên hệ|/contact|T\-Contact|
|Tiện ích|Tìm kiếm|/search?q=\&type=|T\-Search|
|Tiện ích|Đăng nhập, đăng ký, tài khoản|/signin, /signup, /account/\*|T\-Auth / T\-Account|
|Tiện ích|Hỗ trợ / FAQ người dùng Wi\-Fi|/support/faq|T\-FAQ|
|Pháp lý|Privacy, Terms, Cookie|/legal/\{slug\}|T\-Article|

### 4\.3 Chuyển URL cũ \(301\)

|URL cũ|URL mới|
|---|---|
|/en/our\-platform, /our\-platform/our\-technology|/en/products|
|/en/advertisers/our\-products|/en/products/location\-based\-channel/interactive\-ad\-experiences|
|/en/advertisers/case\-studies, /wi\-fi\-partners/our\-partner\-portfolio|/en/resources/case\-studies|
|/en/wi\-fi\-partners/our\-solutions|/en/products/network/partner\-network|
|/en/wi\-fi\-users/what\-we\-offer, /wi\-fi\-users/faq/\*|/en/support/faq|
|/en/about\-us, /media/investors|/en/about, /en/about/investors|
|/en/about\-us/recruitment, /job\-details/\{id\}|/en/careers, /en/careers/\{slug\}|
|/en/media/news/\{slug\}|/en/news/\{slug\}|
|/en/contact\-us|/en/contact|

BA lập bảng ánh xạ đầy đủ cả 572 URL trước R1; QA kiểm tra tự động từng dòng\.

### 4\.4 Footer

|Cột|Nội dung|
|---|---|
|Products|6 sản phẩm|
|Data \& Resources|Data Overview, Explorer, Reports, Case studies, Events, News|
|Company|About, Partners, Customers, Investors, Careers, Contact|
|Support|FAQ người dùng Wi\-Fi, Đăng nhập ACM/AAP, Privacy, Terms, Cookie settings|
|Liên hệ|Văn phòng Hà Nội, TP\.HCM, Jakarta; email, hotline; đăng ký nhận tin; mạng xã hội \(Facebook, LinkedIn, YouTube, Zalo OA, TikTok\); chọn thị trường/ngôn ngữ|

## 5\. Yêu cầu chức năng

Mỗi yêu cầu có mã, tiêu chí nghiệm thu và đợt phát hành; PM chuyển mỗi dòng thành một story hoặc epic trong backlog\. Yêu cầu về Data, Lead và Account nằm ở mục 6\.

### 5\.1 Home

|Mã|Yêu cầu|Tiêu chí nghiệm thu|Release|
|---|---|---|---|
|HOME\-01|Hero thể hiện định vị mới và 6 sản phẩm \(carousel hoặc tab\)|Chọn một sản phẩm thì đổi hình, màu, CTA; LCP \< 2,5 giây trên 4G|R1|
|HOME\-02|Khối 6 sản phẩm dạng thẻ theo infographic|Mỗi thẻ có nhãn mục tiêu, tên, slogan, 4 tính năng, link chi tiết|R1|
|HOME\-03|Hình ảnh minh hoạ mới \(ảnh thật, địa điểm thật\)|Toàn bộ ảnh qua CMS, có alt, AVIF/WebP|R1|
|HOME\-04|Dải snapshot dữ liệu: tổng, hiện tại, xu hướng|Dùng chung Data API với /data; ghi "Cập nhật lúc…"; R1 dùng số nhập tay từ CMS|R1 / R2|
|HOME\-05|Showcase nội dung mới nhất từ News, Resources, Events|Tự cập nhật khi xuất bản; render phía server|R1|
|HOME\-06|CTA "Get data" và "Talk to us"|Mở lead form với ngữ cảnh nguồn \(trang, khối\)|R1|

### 5\.2 Products và Solutions

|Mã|Yêu cầu|Tiêu chí nghiệm thu|Release|
|---|---|---|---|
|PROD\-01|Trang danh sách 6 sản phẩm|Thứ tự, màu, nội dung quản lý trong CMS|R1|
|PROD\-02|Trang chi tiết sản phẩm theo mẫu deck: Hero → Opportunity → Solutions → How to plan → Showcase → Lead form|Marketing tự ghép khối trong CMS, không cần dev|R1|
|PROD\-03|Trang chi tiết Solution|Có breadcrumb, các Solution cùng sản phẩm, case study liên quan|R1|
|PROD\-04|Catalogue định dạng quảng cáo trong Solution "Interactive Ad Experiences"|Mỗi định dạng có mô phỏng trên khung điện thoại và thông số|R1|
|PROD\-05|Theme theo sản phẩm|Trang tự đổi màu theo data\-product|R1|

### 5\.3 Insights \& Resources, Events, News

|Mã|Yêu cầu|Tiêu chí nghiệm thu|Release|
|---|---|---|---|
|RES\-01|Hub tài liệu lọc theo loại \(Report, Paper, Case study\), ngành, sản phẩm, năm|Bộ lọc lưu trên URL; phân trang|R1|
|RES\-02|Trang Report dạng kể chuyện theo economysea: infographic tương tác, rê/chạm icon để hiện số liệu|Hoạt động bằng bàn phím và cảm ứng; có bản tĩnh khi giảm chuyển động|R3|
|RES\-03|Tải báo cáo theo ngành/khu vực, yêu cầu lead form \(tầng Lead\)|File gửi qua email sau khi xác thực|R2|
|RES\-04|Kho báo cáo các năm trước|Danh sách theo năm|R3|
|RES\-05|Tóm tắt audio hoặc AI cho mỗi báo cáo|Tùy chọn, để sau R3 nếu thiếu nguồn lực|R3\+|
|EVT\-01<br>|Danh sách sự kiện sắp tới / đã qua<br>|Lọc theo thời gian, hình thức \(online/offline\), thị trường|R1|
|EVT\-02|Chi tiết sự kiện: đăng ký, thêm vào lịch \(\.ics\), bản đồ|Đăng ký đẩy vào CRM; schema Event; sự kiện đã qua hiện slide/video|R1|
|NEWS\-01|Giữ 118 bài tin, thêm tag, bộ lọc, bài liên quan|Không mất bài nào; 301 đầy đủ; schema NewsArticle|R1|

### 5\.4 Company và Careers

|Mã|Yêu cầu|Tiêu chí nghiệm thu|Release|
|---|---|---|---|
|COMP\-01|About: định vị, lịch sử, đội ngũ, văn phòng VN/ID|Nội dung quản lý trong CMS|R1|
|COMP\-02|Partners: đối tác địa điểm, đối tác chiến lược, nhà đầu tư|Chỉ hiển thị logo đã được đồng ý \(cờ trong CMS\)|R1|
|COMP\-03|Customers: logo wall, testimonial, link case study|Như COMP\-02<br>|R1|
|JOB\-01|Danh sách việc làm lọc theo phòng ban, địa điểm|Tin hết hạn tự ẩn|R1|
|JOB\-02|Chi tiết và nộp CV online \(PDF/DOCX ≤ 5 MB\)|Có checkbox đồng ý xử lý dữ liệu; quét virus file; schema JobPosting|R1|

### 5\.5 Search, Social, Contact

|Mã|Yêu cầu|Tiêu chí nghiệm thu|Release|
|---|---|---|---|
|SRCH\-01|Ô tìm kiếm chung, gợi ý khi gõ|Gợi ý \< 200 ms; tìm được không dấu \("quang cao" ra "quảng cáo"\)|R1|
|SRCH\-02|Trang kết quả có tab: Tất cả, Products, Data, Resources, Events, News, Careers|Tab và từ khoá lưu trên URL; đếm kết quả mỗi tab|R1|
|SRCH\-03|Tìm theo ngôn ngữ đang xem, có tuỳ chọn mọi ngôn ngữ|Đúng locale mặc định|R1|
|SOC\-01|Link mạng xã hội: Facebook, LinkedIn, YouTube, Zalo OA, TikTok|Ở footer và trang Contact|R1|
|SOC\-02|Nút chia sẻ, ảnh OG riêng từng trang|Ảnh OG tự sinh nếu CMS không có|R1|
|CONT\-01|Trang Contact với lead form, văn phòng, bản đồ|Dùng chung component lead form \(mục 6\)|R1|

## 6\. Data, Lead và Account

Dữ liệu mạng lưới được mở theo 3 tầng: ai cũng xem được snapshot, điền lead form để xem chi tiết, tạo tài khoản để lưu và làm việc tiếp với dữ liệu\.

### 6\.1 Ba tầng truy cập

|Tầng|Điều kiện|Được xem / được làm|
|---|---|---|
|0\. Khách|Không cần gì|Snapshot \(tổng, hiện tại, xu hướng\); heatmap tổng hợp theo tỉnh hoặc ô lớn|
|1\. Lead|Điền lead form và xác thực email \(OTP hoặc magic link\)|Breakdown/config theo thông tin đã khai; heatmap chi tiết; nhận file dữ liệu qua email|
|2a\. Tài khoản tiềm năng|Đăng ký từ lead form \(chỉ cần đặt mật khẩu hoặc dùng Google/Microsoft\)|Lưu lịch sử truy cập, bộ lọc đã tạo, tài liệu đã xem|
|2b\. Khách hàng hiện hữu|Tài khoản do AWING admin cấp, phân quyền theo workspace|Vào ACM/AAP; dữ liệu riêng của workspace nằm trong ACM/AAP|

### 6\.2 Lead form

|Trường|Bắt buộc|Kiểm tra|Dùng để|
|---|---|---|---|
|Email|Có|Định dạng, OTP; cảnh báo email cá nhân \(gmail…\) nhưng không chặn|Định danh, tạo tài khoản|
|Số điện thoại|Có|Định dạng E\.164 theo thị trường|Sales liên hệ|
|Họ và tên|Có|≤ 100 ký tự|Tài khoản, CRM|
|Công ty|Có|≤ 150 ký tự|CRM, gộp tài khoản|
|Ngành|Không|Danh sách cố định|Mở breakdown ngành|
|Tên thương hiệu|Không|Text|Chỉ cho sales, không mở dữ liệu|
|Khu vực|Không|Danh sách tỉnh/thành, nhiều lựa chọn|Mở heatmap chi tiết khu vực|
|Ghi chú yêu cầu|Không|≤ 1\.000 ký tự|Sales|
|Đồng ý xử lý dữ liệu|Có|Checkbox tách theo mục đích \(liên hệ, nhận tin\)|Tuân thủ|
|Trường ẩn|—|UTM, trang nguồn, khối CTA, ngôn ngữ, thị trường|Phân bổ nguồn lead|

Form dùng chung một component, mở ở dạng popup hoặc nhúng trong trang\. Người dùng có thể bổ sung trường tuỳ chọn sau; mỗi lần bổ sung mở thêm view\.

### 6\.3 Ma trận mở khoá \(bản đề xuất, chờ duyệt\)

|Dữ liệu<br>|Khách|Lead|Lead \+ Ngành|Lead \+ Khu vực|Tài khoản|
|---|---|---|---|---|---|
|Snapshot toàn quốc|Có|Có|Có|Có|Có|
|Xu hướng theo ngày, 90 ngày gần nhất|30 ngày|Có|Có|Có|Có|
|Heatmap theo tỉnh|Có|Có|Có|Có|Có|
|Heatmap ô nhỏ \(H3 res 7\)|Không<br>|Toàn quốc|Toàn quốc|Khu vực đã chọn \(H3 res 8\)|Như lúc đã mở|
|Breakdown theo loại địa điểm|Không|Có|Có|Có|Có|
|Breakdown theo ngành quảng cáo, định dạng phù hợp|Không|Không|Ngành đã chọn|Không<br>|Như lúc đã mở|
|Gửi file qua email \(XLSX/PDF\)|Không|3 lần / ngày|3 lần / ngày|3 lần / ngày|5 lần / ngày|
|Lưu view, lịch sử, tài liệu đã xem|Không|Không|Không|Không|Có|

### 6\.4 Phân loại dữ liệu

|Được công khai \(sau khi duyệt\)|Không bao giờ công khai|
|---|---|
|Tổng lượt Wi\-Fi login, lượt view|Doanh thu, tăng trưởng doanh thu|
|Số điểm, số địa điểm, số tỉnh/thành|Tên khách hàng kèm doanh thu, số media plan|
|Mật độ theo tỉnh hoặc ô lục giác H3|Toạ độ chính xác từng điểm|
|Tỷ lệ login/view theo định dạng|Tên chuỗi đối tác chưa có đồng ý|
|Phân bổ theo loại địa điểm \(TTTM, F\&B, bệnh viện…\)|Dữ liệu cá nhân người dùng Wi\-Fi|

Quy tắc: ô nào có ít hơn 5 điểm hoặc 1\.000 lượt thì gộp vào ô lớn hơn\. Mỗi số liệu ghi "Cập nhật lúc…", không dùng chữ "Realtime"\.

### 6\.5 Yêu cầu chức năng

|Mã|Yêu cầu|Tiêu chí nghiệm thu|Release|
|---|---|---|---|
|DATA\-01|Trang Overview: thẻ số liệu lớn, biểu đồ xu hướng, bảng xếp hạng tỉnh/thành, loại địa điểm|Cập nhật trước 07:00 hàng ngày|R2|
|DATA\-02|Bộ lọc chung \(thời gian, khu vực, loại địa điểm\) lưu trên URL|Copy URL mở lại đúng view|R2|
|DATA\-03|Mỗi biểu đồ có nút chia sẻ, nhúng \(iframe\), tải PNG/CSV|CSV chỉ gồm dữ liệu của tầng hiện tại|R2|
|DATA\-04|Explorer: chọn chỉ số, chiều breakdown, kiểu biểu đồ|Mục bị khoá hiện biểu tượng khoá và mở lead form|R2|
|DATA\-05|Heatmap: bản đồ ô lục giác, chế độ bong bóng / mật độ, chú giải|Bản đồ chỉ tải khi cuộn tới; 60 fps trên laptop phổ thông|R2|
|DATA\-06|Trang Methodology|Giải thích nguồn, cách tính, ngưỡng gộp|R2|
|LEAD\-01|Lead form dùng chung, xác thực OTP, chống spam \(Turnstile\)|Lead vào CRM trong \< 1 phút; báo sales|R1|
|LEAD\-02|Mở khoá theo ma trận 6\.3|Quyền kiểm tra ở server, không chỉ ở giao diện|R2|
|LEAD\-03|Gửi file dữ liệu qua email \(xử lý nền\)|File gửi trong \< 5 phút; link hết hạn sau 7 ngày|R2|
|ACC\-01|Đăng ký từ lead form, điền sẵn thông tin|Chỉ cần 1 bước đặt mật khẩu hoặc Google/Microsoft|R2|
|ACC\-02|Trang tài khoản: view đã lưu, lịch sử, tài liệu đã xem, hồ sơ|Xoá tài khoản và xuất dữ liệu cá nhân được|R2|
|ACC\-03|Sign in có 2 lựa chọn; "Khách hàng AWING" chuyển sang trang đăng nhập ACM/AAP|Không đổi ACM/AAP ở R2|R2|
|ACC\-04|Đăng nhập một lần \(SSO\) với ACM/AAP; gộp tài khoản khi trùng email|Cần ACM/AAP hỗ trợ OIDC|R4|

## 7\. Thiết kế \(Designer\)

Ngôn ngữ thiết kế là nền trung tính, logo đỏ, màu sản phẩm làm điểm nhấn và dải ruộng\-băng của logo làm chuyển động đặc trưng; sản phẩm bàn giao là design system trên Figma và 21 template trang\.

### 7\.1 Logo

|Bản|Dùng khi|
|---|---|
|Wordmark đỏ \(chính\)|Header, footer, trang trắng|
|Wordmark trắng|Nền tối, nền ảnh, hero video|
|Wordmark xanh|Chỉ trong khu vực sản phẩm Network \(cần xác nhận\)|
|Wordmark xám|In đơn sắc, watermark|
|Biểu tượng A|Favicon, icon app, header thu nhỏ, loader|

- Màu logo đo trên PNG \(tương đối\): đỏ chính \~\#D2232A, bóng \~\#9B0E0E, đầu dải \~\#F07355; xanh \~\#0050BE, bóng \~\#0000A0, đầu dải \~\#6464FF\. Lấy giá trị chính xác từ file \.ai\.

- Logo giữ nguyên màu như tác phẩm; giao diện chỉ dùng token màu ở 7\.2\.

- Dưới \~32 px chuyển màu bị mất: cần thêm bản màu phẳng cho favicon 16/32 px\.

- Lockup sản phẩm: wordmark chuẩn \+ tên sản phẩm viết bằng màu sản phẩm\. Không tô lại màu wordmark \(deck Retail Media đang tô cam\)\.

- Cần xuất từ file \.ai: SVG cho từng artboard, SVG tách lớp dải ruộng\-băng để làm hiệu ứng, favicon \(ICO, PNG 180/192/512\), ảnh OG mặc định 1200×630\.

### 7\.2 Màu

|Token|Sản phẩm|Primary|Chữ trắng trên nền \(WCAG AA ≥ 4,5\)|Quy tắc|
|---|---|---|---|---|
|\-\-p\-location|01 Location\-Based Channel|\#E31E24|\~4,7 – đạt \(sát ngưỡng\)|Phân biệt với đỏ CTA bằng biến thể Dark/Light|
|\-\-p\-retail|02 Retail Media \& Activation|\#F36C02|\~3,0 – không đạt|Chữ trắng chỉ ≥ 24 px; nút dùng bản Dark|
|\-\-p\-measurement|03 Measurement|\#F5C400|\~1,7 – không đạt|Luôn dùng chữ tối|
|\-\-p\-insight|04 Insights|\#10AD5E|\~2,9 – không đạt|Chữ trắng chỉ ≥ 24 px; nút dùng bản Dark|
|\-\-p\-network|05 Network|\#0F57EE|\~5,8 – đạt|—|
|\-\-p\-adsmanager|06 Ads Manager|\#703FBC|\~6,6 – đạt|—|

- Mỗi sản phẩm có thêm token \-dark, \-light, \-combo theo bảng màu đã chốt; tỷ lệ 80/20 giữa màu chính và màu phối\.

- Cặp màu phối tương phản mạnh \(cam–xanh, tím–vàng, xanh lá–hồng\) chỉ dùng cho chi tiết nhỏ\.

- Màu trung tính: nền \#FFFFFF, \#F5F6F8; chữ \#111318, \#5B606B; viền \#E3E5EA\. Có bản dark mode cho trang Data\.

- Biểu đồ dùng 6 màu sản phẩm làm bảng màu phân loại; thang mật độ heatmap dùng một dải đơn sắc\.

- Sửa lỗi chính tả "MESUREMENT" trên slide bảng màu\.

### 7\.3 Chữ, lưới, thành phần

- **Font:** đề xuất Be Vietnam Pro cho tiêu đề, Inter cho nội dung và số liệu \(số đều cột tabular\-nums\); cả hai đủ dấu tiếng Việt và Bahasa\. Nếu AWING đã có font thương hiệu thì dùng font đó\.

- **Thang chữ:** 56 / 40 / 32 / 24 / 20 / 16 / 14 / 12 px \(desktop\), giảm một bậc trên mobile\.

- **Lưới:** 12 cột, rộng tối đa 1280 px, khoảng cách theo bội số 8; breakpoint 360 / 768 / 1024 / 1440\.

- **Thành phần tối thiểu:** nút, input, lead form \(popup và nhúng\), thẻ sản phẩm, thẻ nội dung, thẻ số liệu, biểu đồ \(line, bar, donut, bảng xếp hạng\), bản đồ, bộ lọc, tab, breadcrumb, phân trang, mega menu, khóa nội dung \(locked state\), toast, modal\.

### 7\.4 Chuyển động

- **Đặc trưng:** dải ruộng\-băng của chữ A "gấp" lại khi tải trang và ở hero; dải ruộng\-băng chạy dọc trang khi cuộn trên Home và trang Report\.

- **Chung:** hiện dần khi cuộn \(200–400 ms, ease\-out\), bộ đếm số trên thẻ số liệu, bản đồ bay tới khu vực, icon động bằng Lottie\.

- **Giới hạn:** tôn trọng prefers\-reduced\-motion; không chặn nội dung chờ hiệu ứng; không dùng WebGL nặng trên mobile ngoài bản đồ\.

### 7\.5 Template trang

|Template|Cấu trúc|Tham khảo chính|
|---|---|---|
|T\-Home|Hero 6 sản phẩm → ô truy cập nhanh → dải snapshot dữ liệu → thẻ sản phẩm → nội dung mới nhất → CTA|vps\.com\.vn, economysea|
|T\-ProductList|6 thẻ theo infographic \(số, nhãn mục tiêu, tên, slogan, mô tả, 4 tính năng, ảnh, câu chốt\)|Infographic Product \& Solution|
|T\-ProductDetail|Hero → Opportunity → Solutions → How to plan → Showcase → Lead form|Deck Retail Media|
|T\-SolutionDetail|Hero → vấn đề → cách hoạt động → định dạng/thông số → case study → Lead form|Google Ad Manager, Meta Business|
|T\-DataOverview / Explorer / Map|Bộ lọc chung → thẻ số liệu → lưới biểu đồ có nút chia sẻ → bản đồ|radar\.cloudflare\.com|
|T\-ReportStory|Kể chuyện cuộn, infographic tương tác, tải theo ngành, kho báo cáo cũ|economysea|
|T\-ResourceHub, T\-List, T\-Article|Lọc \+ lưới thẻ; bài đọc có mục lục, chia sẻ, bài liên quan|YouNet Media, VNG Cloud|
|T\-EventList / Detail, T\-JobList / Detail|Danh sách có lọc; chi tiết có form đăng ký / nộp CV|VNG Cloud|
|T\-Search, T\-Auth, T\-Account, T\-Contact, T\-Page, T\-FAQ|Theo yêu cầu mục 5–6|Meta Business, Google|

### 7\.6 Bàn giao của Designer

- ☐ Moodboard từ các web tham khảo, chọn mẫu cụ thể cho từng template

- ☐ Design token \(màu, chữ, khoảng cách, bo góc, bóng\) xuất JSON cho dev

- ☐ Thư viện component trên Figma, có trạng thái \(hover, focus, disabled, locked, lỗi\)

- ☐ Thiết kế 21 template ở desktop và mobile

- ☐ Prototype luồng Lead → Xác thực → Mở khoá → Đăng ký

- ☐ File Lottie và SVG cho hiệu ứng logo

## 8\. Kỹ thuật \(Developer\)

Giữ Next\.js \+ Strapi và bổ sung 4 khối mới: Data API \(dữ liệu tổng hợp hàng ngày\), dịch vụ đăng nhập, công cụ tìm kiếm và hàng đợi tạo báo cáo\.

![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=Mzk4MTk1MTk2N2MzZTc5NzkzNTJlYzA0ZTU1NDg5YTZfOWYxZWVlMzdhNDY1ZjNlYzlhZTVlYzdlOTE0NGJmZjdfSUQ6NzcwOTgyNjI2MTg0NTIxNjgwMF8xNzk1NDE4NTM3OjE3OTU1MDQ5MzdfVjM)

kiến trúc hệ thống · 10 thành phần

Trình duyệt chỉ nói chuyện với Next\.js; Next\.js gọi các dịch vụ phía sau, và Data API chỉ đọc bảng đã tổng hợp, không đọc DWH trực tiếp\.

### 8\.1 Thành phần

|Thành phần|Công nghệ đề xuất|Vai trò|
|---|---|---|
|Frontend|Next\.js \(App Router\), TypeScript, Tailwind, ISR/SSR, next\-intl|Render trang, đa domain, đa locale|
|CMS|Strapi \(nâng lên bản mới nhất\), plugin i18n|Nội dung, dynamic zone để ghép khối|
|Data pipeline|ETL hàng ngày từ DWH \(nguồn của dashboard Power BI\) → PostgreSQL \+ bảng tổng hợp, H3|Tính sẵn số liệu, áp ngưỡng gộp|
|Data API|Node \(NestJS hoặc Next route handlers\), Redis cache|Trả dữ liệu theo tầng quyền|
|Bản đồ, biểu đồ|MapLibre GL \+ deck\.gl \(H3HexagonLayer\), ECharts hoặc visx|Heatmap, biểu đồ tương tác|
|Đăng nhập|Keycloak \(tự host tại VN\) hoặc Auth0; OIDC|Tài khoản tiềm năng, SSO ACM/AAP về sau|
|Tìm kiếm|Meilisearch \(tự host\)|Index từ Strapi qua webhook|
|Hàng đợi|BullMQ \+ Redis; Puppeteer cho PDF, ExcelJS cho XLSX|Gửi file dữ liệu, báo cáo|
|Email|Amazon SES hoặc SendGrid|OTP, magic link, file|
|CRM|CRM AWING đang dùng \(chờ xác nhận\)|Nhận lead, đăng ký sự kiện, CV|
|Hạ tầng|CDN \(Cloudflare\), container \(Docker\), CI/CD|Hiệu năng, bảo mật, triển khai|

### 8\.2 Content model \(Strapi\)

|Collection|Trường chính|Quan hệ|
|---|---|---|
|Product|name, slug, number, color token, tagline, goal label, summary, features\[4\], hero, blocks \(dynamic zone\)|1–n Solution|
|Solution|name, slug, summary, blocks, formats\[\]|n–1 Product; n–n CaseStudy|
|AdFormat|name, specs, preview media|n–1 Solution|
|Resource|type \(report/paper/case\-study\), title, slug, industry\[\], product\[\], year, file, gated, story blocks|n–n Product|
|Event|title, slug, start, end, mode, location, registration, recap media|—|
|News|title, slug, date, tags, body, cover|—|
|Job|title, slug, department, location, deadline, body|—|
|Partner / Customer|name, logo, type, consent flag, testimonial|n–n CaseStudy|
|DataSnapshot \(R1 tạm\)|label, value, unit, trend, as\-of|Dùng trước khi có Data API|
|Global|header, footer, social, offices, SEO mặc định|—|

Mọi collection có locale và trường market \(vn, id…\) để một CMS phục vụ nhiều thị trường\.

### 8\.3 Data API

|Endpoint|Tầng tối thiểu|Mô tả|
|---|---|---|
|GET /v1/snapshot|Khách|Số liệu tổng, hiện tại, xu hướng; có asOf|
|GET /v1/timeseries?metric=\&from=\&to=\&region=|Khách \(30 ngày\) / Lead|Chuỗi theo ngày|
|GET /v1/breakdown?metric=\&by=|Lead|Theo loại địa điểm, ngành, định dạng \(theo ma trận 6\.3\)|
|GET /v1/hexes?res=\&bbox=|Khách \(tỉnh\) / Lead \(H3\)|Ô lục giác đã gộp ngưỡng|
|POST /v1/exports|Lead|Tạo file, gửi email; trả mã job|
|GET/POST /v1/me/views|Tài khoản|View đã lưu, lịch sử|

- Quyền kiểm tra ở server theo token \(JWT từ dịch vụ đăng nhập, hoặc token lead ngắn hạn sau OTP\); giao diện chỉ ẩn/hiện\.

- Không endpoint nào trả toạ độ thô hay dữ liệu doanh thu\.

- Cache: Khách 24 giờ tại CDN; Lead 1 giờ tại Redis; xoá cache sau mỗi lần ETL\.

- Giới hạn: 60 request/phút/IP cho Khách; xuất file theo ma trận 6\.3\.

### 8\.4 Đa domain, đa ngôn ngữ, SEO

- Middleware Next\.js chọn market theo domain và locale theo đường dẫn; không tự chuyển hướng theo IP, chỉ gợi ý bằng banner\.

- Canonical trỏ về chính trang; hreflang chéo domain \(vi\-VN, en\-VN, en, id\-ID, x\-default\); sitemap riêng mỗi domain\.

- Schema: Organization, WebSite \+ SearchAction, Product, Article/NewsArticle, Event, JobPosting, FAQPage, BreadcrumbList, Dataset \(trang Data\)\.

- Staging: noindex, chặn bằng mật khẩu hoặc IP\.

### 8\.5 Hiệu năng, bảo mật, tuân thủ

|Hạng mục|Mục tiêu / yêu cầu|
|---|---|
|Core Web Vitals|LCP \< 2,5 giây, INP \< 200 ms, CLS \< 0,1 ở p75 mobile; JS ban đầu \< 200 KB \(gzip\), trừ trang Data|
|Ảnh|next/image, AVIF/WebP, lazy load, CDN cho ảnh Strapi|
|Truy cập \(a11y\)|WCAG 2\.2 AA; dùng được bằng bàn phím; biểu đồ có bảng dữ liệu thay thế|
|Bảo mật|CSP, HSTS; Strapi admin chỉ mở theo IP/VPN; Turnstile cho form; quét virus file CV; cập nhật dependency hàng tháng|
|Dữ liệu cá nhân|Luật BVDLCN, NĐ 13/2023 \(VN\), UU PDP \(Indonesia\): đồng ý tách mục đích, nhật ký đồng ý, xoá/xuất tài khoản, lưu trữ tại VN cho dữ liệu VN|
|Giám sát|Sentry, uptime check, cảnh báo ETL lỗi hoặc trễ|
|Kiểm thử|Unit test; E2E Playwright cho lead form, mở khoá, đăng ký; Lighthouse CI chặn merge khi tụt điểm; kiểm tra 301 tự động|
|Môi trường|dev → staging → production; preview cho mỗi pull request|

## 9\. Lộ trình và nhân sự

Dự án kéo dài khoảng 10 tháng, 4 đợt phát hành; R1 \(website lõi\) ra mắt cuối tháng 4, R2 \(Data \& Account\) cuối tháng 6\.

![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=NTY5N2NhMTcwYjI0ODA2NWNiM2ZmMDExODNhNjIxNWRfMmRhYjIwZTBhNzE4OWQ2OWQ5NTA4MGYwZTMwMzIxOGNfSUQ6NzcwOTgyNjI2MTg0NTIzMzE4NF8xNzk1NDE4NTM3OjE3OTU1MDQ5MzdfVjM)

lộ trình 10 tháng · 6 giai đoạn, 4 đợt phát hành

Các giai đoạn chồng nhau có chủ đích: thiết kế đi trước phát triển một sprint, và data pipeline bắt đầu khi website lõi đang làm\.

### 9\.1 Giai đoạn và điều kiện qua cổng

|GĐ|Thời gian|Nội dung|Điều kiện hoàn thành|
|---|---|---|---|
|0\. Sửa lỗi nền tảng|Tuần 1–3|FIX\-01 đến FIX\-07, GA4/GTM, consent banner|Search Console không còn URL staging; canonical, hreflang đúng|
|1\. Discovery \& Design|Tuần 2–8|Bảng ánh xạ URL, nội dung 6 Product/26 Solution, design system, 21 template, duyệt ma trận dữ liệu|Ban lãnh đạo duyệt thiết kế và ma trận 6\.3|
|2\. Core site \(R1\)|Tháng 2–4|Mục 5 \(trừ phần R2–R3\), lead form, CRM, search, 301|100% URL cũ redirect đúng; CWV đạt; UAT ký|
|3\. Data \& Account \(R2\)|Tháng 3–6|ETL, Data API, Overview, Explorer, Heatmap, mở khoá, xuất file, tài khoản tiềm năng|Kiểm thử quyền \(pentest\) đạt; số liệu khớp DWH|
|4\. Storytelling \(R3\)|Tháng 5–7|T\-ReportStory, báo cáo đầu tiên, kho báo cáo|Báo cáo đầu tiên xuất bản|
|5\. Đa thị trường \(R4\)|Tháng 7–10|awing\.global, Indonesia, quy trình bản địa hoá, SSO ACM/AAP|Trang ID ra mắt; SSO chạy với 1 workspace thí điểm|

### 9\.2 Nhân sự

|Vai trò|Số lượng|Giai đoạn|
|---|---|---|
|PM / BA|1|Toàn dự án|
|UI/UX designer|1|GĐ1 toàn thời gian, sau đó 50%|
|Motion designer|1 \(bán thời gian\)|GĐ1, GĐ4|
|Frontend \(Next\.js\)|2–3|GĐ0, GĐ2–5|
|Backend \(Strapi, Data API, Auth\)|1|GĐ2–5|
|Data engineer \(ETL\)|1|GĐ3, sau đó bảo trì|
|QA|1|GĐ2–5|
|Content / SEO|1|Toàn dự án; thêm người bản địa hoá ở GĐ5|

### 9\.3 Phân vai \(RACI\)

|Việc|PM|Designer|Developer|Data|Marketing|Lãnh đạo|
|---|---|---|---|---|---|---|
|Sitemap, yêu cầu|A/R|C|C|C|C|I|
|Design system, template|A|R|C|I|C|I|
|Nội dung sản phẩm, bài viết|A|C|I|I|R|C|
|Phát triển website|A|C|R|I|I|I|
|Phân loại dữ liệu, ma trận mở khoá|R|I|C|C|C|A|
|ETL, Data API|A|I|R|R|I|I|
|Kiểm thử, nghiệm thu|A|C|R|C|C|I|
|Phát hành|R|I|R|I|C|A|

R = thực hiện, A = chịu trách nhiệm cuối, C = tham vấn, I = được thông báo\.

### 9\.4 Cách làm việc

- Sprint 2 tuần; demo cuối sprint trên staging\.

- Definition of Done: đúng tiêu chí nghiệm thu, có test, Lighthouse CI đạt, kiểm tra a11y, nội dung song ngữ, đã gắn tracking\.

- Thiết kế đi trước phát triển ít nhất 1 sprint\.

## 10\. KPI, tracking, rủi ro và việc còn mở

Thành công được đo bằng số lead đã xác thực và tỷ lệ chuyển sang tài khoản; số nền đo trong GĐ0\.

### 10\.1 KPI

|Chỉ số|Mục tiêu|Thời điểm|
|---|---|---|
|Lead đã xác thực email / tháng|\+50% so với số nền|3 tháng sau R2|
|Tỷ lệ lead điền thêm trường tuỳ chọn|≥ 40%|3 tháng sau R2|
|Tỷ lệ lead → tài khoản|≥ 20%|3 tháng sau R2|
|Organic traffic|\+50–100%|6 tháng sau R1|
|Core Web Vitals|100% URL "Good" \(trang Data đo riêng\)|Liên tục|
|Lỗi ETL / trễ cập nhật|\< 2 lần / tháng|Liên tục|

### 10\.2 Tracking plan \(GA4 qua GTM\)

|Sự kiện|Khi nào|Tham số|
|---|---|---|
|cta\_click|Bấm CTA bất kỳ|cta\_id, page\_type, product|
|lead\_form\_open / lead\_form\_submit|Mở / gửi lead form|source\_block, product, fields\_filled|
|lead\_verified|Xác thực OTP thành công|method|
|data\_unlock|Mở khoá view mới|view\_id, unlock\_by \(industry/region\)|
|data\_filter / data\_share / data\_export|Dùng bộ lọc / chia sẻ / xuất|metric, dimension, format|
|sign\_up / login|Tạo tài khoản / đăng nhập|account\_type, method|
|resource\_download|Tải tài liệu|resource\_type, slug|
|search|Tìm kiếm|term, tab, results\_count|
|event\_register / job\_apply|Đăng ký sự kiện / nộp CV|slug|

Không gửi email, số điện thoại hay tên vào GA4; chỉ gửi mã định danh ẩn danh\.

### 10\.3 Rủi ro

|Rủi ro|Ảnh hưởng|Cách giảm|
|---|---|---|
|Lộ dữ liệu kinh doanh qua trang Data|Cao|Chỉ trả dữ liệu tổng hợp từ server, ngưỡng gộp, pentest trước R2, mọi chỉ số công khai qua duyệt|
|Lead ảo, cào dữ liệu|Trung bình|OTP, Turnstile, giới hạn request và số lần xuất file|
|Mất thứ hạng khi đổi cấu trúc|Cao|Bảng 301 đầy đủ, kiểm tra tự động, theo dõi Search Console 8 tuần|
|Nội dung 26 Solution chậm|Trung bình|Ưu tiên Retail Media \(đã có deck\), các Solution khác ra mắt theo đợt|
|ACM/AAP chưa hỗ trợ OIDC|Trung bình|R2 chỉ chuyển hướng sang trang đăng nhập cũ; SSO để R4|
|Vi phạm quy định dữ liệu cá nhân|Cao|Đồng ý tách mục đích, nhật ký đồng ý, pháp chế duyệt form trước R1|

### 10\.4 Việc còn mở

- ☐ Report on demand có mở cho tài khoản tiềm năng \(giới hạn lượt\) hay chỉ cho khách hàng hiện hữu?

- ☐ Ai duyệt danh sách chỉ số công khai và ma trận mở khoá 6\.3?

- ☐ Đối tác chuỗi \(Winmart, Cinestar, Vinbus…\) đã đồng ý hiển thị tên chưa?

- ☐ Deck chi tiết của Location\-Based Channel, Measurement, Insights, Network, Ads Manager

- ☐ AWING đang dùng CRM nào; có API nhận lead không?

- ☐ DWH nào là nguồn của dashboard Power BI; data team có cấp view/bảng cho ETL không?

- ☐ ACM/AAP có hỗ trợ OIDC/SAML không?

- ☐ AWING có font thương hiệu riêng không?

- ☐ Wordmark xanh dùng trong trường hợp nào?

