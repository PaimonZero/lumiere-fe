# Tổng quan Kiến trúc Frontend - Lumiere AI

Tài liệu này mô tả cấu trúc kiến trúc của dự án Frontend Lumiere AI. Bạn có thể sử dụng tài liệu này làm mẫu để triển khai các cấu trúc tương tự cho các dự án khác.

## 🚀 Công nghệ sử dụng (Technology Stack)

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Quản lý trạng thái (State Management)**: [Redux Toolkit](https://redux-toolkit.js.org/) (Mô hình Slice)
- **Định tuyến (Routing)**: [React Router v6](https://reactrouter.com/)
- **Giao diện (Styling)**: [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) + [Ant Design v5](https://ant.design/)
- **API Client**: [Axios](https://axios-http.com/)
- **Xác thực (Authentication)**: [Google OAuth](https://developers.google.com/identity/gsi/web/guides/overview)

---

## 📂 Cấu trúc thư mục (`src/`)

Thư mục `src` được tổ chức theo mối quan tâm (concern) và tính năng (feature) để đảm bảo khả năng mở rộng và bảo trì.

### 1. `assets/`

Chứa các tài nguyên tĩnh như hình ảnh, biểu tượng SVG và font chữ hệ thống.

### 2. `components/`

Các thành phần giao diện có thể tái sử dụng, được phân loại theo phạm vi:

- **`common/`**: Các thành phần chung dùng cho toàn bộ ứng dụng (Buttons, Inputs, Modals).
- **`ui/`**: Các thành phần giao diện cơ bản (thường từ Shadcn UI).
- **`shared/`**: Các thành phần được chia sẻ giữa các tính năng cụ thể.
- **Thư mục theo tính năng** (ví dụ: `socket/`, `sePay/`): Các thành phần chứa logic nặng liên quan đến các tích hợp cụ thể.

### 3. `layouts/`

Các bản mẫu (templates) cấu trúc bao quanh trang. Ví dụ:

- `MainLayout.jsx`: Chứa thanh điều hướng trên cùng, thanh bên (sidebar) và khu vực nội dung.
- `AuthLayout.jsx`: Chứa các biểu mẫu căn giữa cho Đăng nhập/Đăng ký.

### 4. `pages/`

Các thành phần hiển thị chính (View). Mỗi thư mục con thường đại diện cho một tính năng hoặc module lớn (ví dụ: `Dashboard/`, `SalesOrders/`).

- Tập trung vào việc kết hợp các components và quản lý trạng thái cấp trang.
- Kết nối với Redux hooks (`useDispatch`, `useSelector`).

### 5. `routes/`

Cấu hình định tuyến tập trung:

- `AppRoutes.jsx`: Điểm bắt đầu chính cho tất cả các tuyến đường.
- Các file định tuyến theo module (ví dụ: `AdminRoutes.jsx`, `ProductRoutes.jsx`) để giữ file chính gọn gàng.
- `ProtectedRoute.jsx`: Logic kiểm tra xác thực và phân quyền (authorization).

### 6. `services/`

Lớp API (API Layer).

- `apiClient.js`: Cấu hình instance Axios (base URL, interceptors để gắn token).
- `*Service.js`: Định nghĩa các lời gọi API cụ thể (ví dụ: `authService.js`, `productService.js`).
- Không chứa logic giao diện, chỉ xử lý lấy và gửi dữ liệu.

### 7. `store/`

Quản lý trạng thái toàn cục sử dụng Redux Toolkit.

- `store.js`: Cấu hình root store.
- `*Slice.js`: Các mảng trạng thái (state slices) theo tính năng, bao gồm reducers và extraReducers cho async thunks (xử lý API bất đồng bộ).

### 8. `utils/`

Các hàm tiện ích, trình định dạng (ngày tháng, tiền tệ) và các hằng số dùng chung.

---

## 💻 Ví dụ mã nguồn (Code Examples)

Dưới đây là các ví dụ thực tế từ dự án để bạn hiểu cách các thành phần phối hợp với nhau.

### 1. Định tuyến (React Router) - `src/routes/AppRoutes.jsx`

Dự án sử dụng cách tiếp cận tách biệt các nhóm route để dễ quản lý.

```javascript
// src/routes/AppRoutes.jsx
import { Route, Routes } from "react-router-dom";
import MainLayout from "@src/layouts/MainLayout";
import AuthRoutes from "./AuthRoutes";
import ProductRoutes from "./ProductRoutes";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Route không yêu cầu layout hoặc auth */}
      {AuthRoutes()}

      {/* Route sử dụng MainLayout (Sidebar, Header) */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        {ProductRoutes()}
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Route>
    </Routes>
  );
};
```

### 2. Quản lý trạng thái (Redux Slice) - `src/store/userSlice.js`

Sử dụng `createAsyncThunk` để xử lý các logic bất đồng bộ (API).

```javascript
// src/store/userSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { listUsers } from "@src/services/userService";

// Thunk để gọi API
export const fetchListUsers = createAsyncThunk(
  "user/fetchListUsers",
  async (params, { rejectWithValue }) => {
    try {
      const response = await listUsers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState: { users: [], status: "idle" },
  reducers: {
    // Reducer xử lý logic đồng bộ
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchListUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.users = action.payload;
      });
  },
});
```

### 3. Tầng API (Service) - `src/services/userService.js`

Mọi lời gọi API đều đi qua `apiClient` để quản lý tập trung baseURL và Token.

```javascript
// src/services/userService.js
import apiClient from "./apiClient";

export const listUsers = (params = {}) => {
  return apiClient.get("/users", { params });
};

export const createUser = (userData) => {
  return apiClient.post("/users", userData);
};
```

### 4. Sử dụng trong Component - `src/pages/user/UserManage.jsx`

Kết hợp React hooks và Redux hooks để lấy dữ liệu.

```javascript
// src/pages/user/UserManage.jsx
import { useDispatch, useSelector } from "react-redux";
import { fetchListUsers } from "@src/store/userSlice";

const UserManage = () => {
  const dispatch = useDispatch();
  const { users, status } = useSelector((state) => state.user);

  useEffect(() => {
    // Gọi API khi component mount
    dispatch(fetchListUsers({ limit: 10, offset: 0 }));
  }, [dispatch]);

  if (status === "loading") return <Spin />;

  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
};
```

---

## 🛠️ Luồng làm việc khi thêm tính năng mới (Workflow)

Để duy trì tính nhất quán, hãy làm theo các bước sau khi thêm một tính năng mới (ví dụ: "Invoices"):

1. **Service**: Tạo `src/services/invoiceService.js` để định nghĩa các API calls.
2. **Store**: Tạo `src/store/invoiceSlice.js` để quản lý state và async thunks. Đăng ký slice này vào `src/store/store.js`.
3. **Page**: Tạo thư mục `src/pages/invoices/` và thành phần trang chính.
4. **Route**: Định nghĩa route trong `src/routes/AppRoutes.jsx` hoặc file route con.
5. **Components**: Xây dựng các components dành riêng cho tính năng trong `src/pages/invoices/components/` hoặc `src/components/` nếu chúng có thể tái sử dụng.

---

## 📝 Nguyên tắc phát triển (Best Practices)

- **Giao tiếp Component**: Sử dụng Redux cho trạng thái toàn cục và Props/Context cho trạng thái giao diện cục bộ.
- **API Interceptors**: Luôn sử dụng `apiClient` để đảm bảo token được tự động đính kèm vào các yêu cầu.
- **Quy tắc đặt tên**:
  - Components/Pages: `PascalCase.jsx`
  - Services/Slices/Utils: `camelCase.js`
- **Thiết kế thích ứng (Responsive)**: Tận dụng các lớp utility của Tailwind để thiết kế ưu tiên thiết bị di động (mobile-first).
