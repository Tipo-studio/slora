# Slora Home — Design System

Tài liệu này mô tả các quy ước UI đang được dùng trong Slora Home. Dùng làm chuẩn khi thêm component, page hoặc trạng thái mới để giữ giao diện nhất quán.

> **Nguồn chuẩn:** `src/index.css` và `src/App.tsx`. Khi tài liệu khác với code, ưu tiên code; sau đó cập nhật lại tài liệu này.

## 1. Nền tảng kỹ thuật

- **Runtime:** React + TypeScript + Vite.
- **Styling:** CSS tập trung tại `src/index.css`; Tailwind được import nhưng style component hiện dùng CSS classes và custom properties.
- **Assets:** đặt trong `public/images/` và tham chiếu bằng đường dẫn tuyệt đối, ví dụ `/images/tryon/model.png`.
- **Font:**
  - Nội dung/UI: `Poppins` (`--font-body`).
  - Heading/display: `Playfair Display SC` (`--font-display`).

## 2. Global tokens

Khai báo chính tại `:root` trong `src/index.css`.

### Màu sắc

| Token | Giá trị hiện tại | Mục đích |
|---|---:|---|
| `--color-ink` | `#080d14` | Text chính, button primary, viền active |
| `--color-muted` | `#475569` | Text phụ, metadata, control labels |
| `--color-border` | `#cbd5e1` | Viền control mặc định |
| `--color-surface` | `#f1f5f9` | Surface/input nhẹ |
| `--color-page` | `#f8fafc` | Nền page/panel sáng |
| `--color-upload` | `rgba(217, 234, 255, .3)` | Nền upload card |
| `--color-upload-hover` | `rgba(217, 234, 255, .46)` | Hover upload card |
| `--color-focus` | `#22c55e` | Focus indicator |

### Bo góc

| Token | Giá trị | Dùng cho |
|---|---:|---|
| `--radius-control` | `2px` | Button/form compact, chip, modal controls |
| `--radius-inner` | `8px` | Inner panel, textarea, select |
| `--radius-outer` | `16px` | Upload cards và visual containers |

**Nguyên tắc:** không thêm radius ngẫu nhiên. Chọn token gần nhất; `24px` chỉ dùng cho loading preview đặc biệt theo yêu cầu visual hiện tại.

### Typography và spacing responsive

| Token | Vai trò |
|---|---|
| `--font-body`, `--font-display` | Font family chuẩn |
| `--headline`, `--body`, `--micro`, `--nav` | Scale font responsive |
| `--pad-x`, `--pad-y`, `--main-py` | Page/section padding |
| `--btn-px`, `--btn-py`, `--btn-gap` | Button spacing |
| `--section-gap` | Khoảng cách trong hero/section |
| `--corner`, `--icon` | Kích thước Corner marker và icon |

Các token responsive dùng `clamp()`. Ưu tiên tái sử dụng thay vì viết kích thước viewport mới.

## 3. Buttons

### Primary button

Class: `.button-primary`

- Background `--color-ink`, chữ trắng.
- Tối thiểu 44px; trong Try-On CTA cố định 48px qua `--tryon-action-height`.
- Chữ uppercase, weight 600, tracking `.18em`.
- Hover chuyển background sang `#374151`.

```tsx
<button type="button" className="button-primary">
  ACTION
</button>
```

### Secondary button

Class: `.button-secondary`

- Nền trắng, border `--color-border`.
- Hover chuyển ink background/chữ trắng.

### Quy ước tương tác

- Dùng `<button type="button">` cho hành động client-side.
- Dùng `disabled` cho trạng thái chờ; `.tryon-cta:disabled` đã cung cấp cursor/opacity.
- Không chỉ biểu đạt state bằng màu: giữ `aria-current`, `aria-selected`, `disabled` hoặc text phù hợp.

## 4. Navigation, menu và tabs

### Core Function menu

Class chính: `.core-function-menu-item`

- Height tối thiểu 79px.
- Default: trong suốt, ink text.
- Hover/focus: `#e2e8f0`.
- Active: `--color-ink`, chữ trắng.
- Bốn `Corner` SVG là dấu visual cho active state.

### Try-On tool menu

Class chính: `.tryon-tool-menu`

- Ba tools định nghĩa ở `TRYON_TOOLS` trong `src/App.tsx`.
- Các item tái sử dụng `Corner` component và cùng semantic state (`aria-current="page"`).
- Khi thêm tool mới: thêm object `{ id, label, description }` vào `TRYON_TOOLS`; không hard-code label/description ở JSX.

## 5. Form fields và upload

### Input / textarea / select

- Surface: `--color-surface` hoặc `--color-page` tùy ngữ cảnh.
- Border default: `--color-border`.
- Focus: `--color-focus`.
- Body text: Poppins, thường `16px/24px`.
- Placeholder: `--color-border` hoặc muted tone.

### Upload card

Class: `.tryon-upload-card`

- Kích thước desktop dựa trên `--tryon-control-width` và `--tryon-card-height`.
- Chọn file tạo preview ngay trong card.
- Click lại card để thay file.
- Object URL được quản lý tại `TryOnSection`; không tạo object URL cục bộ trong card mới.

### Preview ảnh upload

- Preview card: `object-fit: contain` trên nền `--color-page`.
- Preview loading: ưu tiên ảnh `Upload person`, fallback sang `Upload Cloths`.
- Ảnh trong loading frame dùng `cover`, blur, saturation/brightness giảm và zoom nhẹ qua `.has-uploaded-image`.
- Khi thay ảnh hoặc unmount, phải gọi `URL.revokeObjectURL()`.

## 6. Try-On workspace

### Kích thước và layout

Các token nội bộ `.tryon-layout`:

| Token | Mục đích |
|---|---|
| `--tryon-control-width` | Width desktop control stack (`370px`) |
| `--tryon-card-height` | Height upload/prompt card (`308px`; `280px` <= 480px) |
| `--tryon-stack-gap` | Khoảng cách stack (`16px`) |
| `--tryon-action-height` | CTA height (`48px`) |
| `--tryon-content-height` | Tổng chiều cao controls/preview |

`tryon-controls`, `tryon-preview`, và model illustration phải dựa trên `--tryon-content-height` để đồng bộ.

### Tool states

| Tool | Nội dung control | CTA |
|---|---|---|
| Try-on | Upload person + Upload Cloths | TRY NOW |
| Magic editor | Upload person + Magic prompt | TRY NOW |
| AI Studio | Magic prompt full remaining area | TRY NOW |

Chuyển tool gọi `selectTool()` để reset preview loading về default.

### Loading preview

Class: `.tryon-phone-frame.is-loading`

- Frame chuyển từ góc 3D nghiêng sang chính diện qua `tryon-preview-loading-in`.
- Nền trắng với grid 28px.
- Border dark-gray mờ, neon green particle quanh viền.
- Có `--loading-border-radius`, `--loading-border-color`, `--loading-light`, `--loading-light-soft`, `--loading-speed`.
- Tôn trọng `prefers-reduced-motion`.

Không dùng animation/box-shadow nặng ngoài lớp loading. Animation particle ưu tiên custom property `--tryon-light-angle` và CSS `@property`.

## 7. Overlay và Join Beta

### Login overlay

- `.login-overlay`: fixed layer `z-index: 100`.
- `.login-backdrop`: dark alpha + blur.
- Modal nhận Escape để close và lock scroll body khi mở.

### Join Beta

- Page độc lập qua route client `/join-beta`.
- Control selected dùng ink + page surface.
- Upload example phải hiện preview và tên file sau chọn.

## 8. Responsive rules

| Breakpoint | Quy ước |
|---|---|
| `>= 1024px` | Desktop layout/absolute positioning cho Core và Try-On |
| `<= 1023px` | Try-On chuyển grid một cột; menu spacing nhỏ hơn |
| `<= 640px` | Header, login, Join Beta compact |
| `<= 480px` | Try-On card giảm height 280px; preview scale phù hợp viewport |
| `prefers-reduced-motion` | Tắt transform/lighting/shimmer animation không thiết yếu |

Khi thêm responsive rule, ưu tiên các breakpoint này. Chỉ tạo breakpoint mới nếu một component có constraint rõ ràng không thể giải quyết bằng `clamp()`.

## 9. Motion guidelines

- Hover controls: `~.2s` ease.
- Preview transition: `.56–.9s`, cubic-bezier chậm dần ở cuối.
- Loading border loop: `2–3s`, linear để không lộ điểm restart.
- Dùng `will-change` chỉ cho phần tử thực sự animate.
- Luôn thêm reduced-motion fallback cho animation lặp hoặc transform đáng kể.

## 10. Asset conventions

- Asset tĩnh: `public/images/<feature>/...`.
- Dùng tên mô tả theo feature: `tryon`, `login`, `join-beta`.
- Giữ asset hiện có nếu có thể; không tạo lại icon bằng CSS khi asset SVG đã tồn tại.
- Với image leaf trong fixed container: chỉ định rõ box/size; không dùng rule global làm stretch asset không liên quan.

## 11. Checklist khi thêm UI

1. Dùng token trong `:root` trước khi thêm màu/radius/spacing hard-code.
2. Tái sử dụng `.button-primary`, `.button-secondary`, `Corner`, hoặc pattern menu hiện có.
3. Bổ sung state semantics (`aria-*`, focus, disabled) cho control tương tác.
4. Kiểm tra desktop, <=1023px, <=640px và <=480px nếu component xuất hiện ở Try-On.
5. Có reduced-motion fallback nếu thêm animation lặp/3D.
6. Nếu dùng object URL, revoke khi thay file và khi unmount.
7. Chạy:

```bash
npm run build
npm run lint
```

## 12. Roadmap đề xuất

Hiện design system là **documented CSS system**. Nếu dự án tăng quy mô, ưu tiên theo thứ tự:

1. Tách `src/styles/tokens.css` từ `:root`.
2. Tách primitives (Button, ToolTab, UploadCard, PromptCard) thành React components có props rõ ràng.
3. Viết visual regression hoặc component tests cho các state Try-On.
4. Chuẩn hóa phần CSS legacy còn hard-code dần dần; không rewrite diện rộng chỉ để format.

---

**Cập nhật lần cuối:** 2026-08-07
**Owner:** Slora Home frontend
