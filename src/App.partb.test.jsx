import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet } from "react-router-dom";
import { Provider } from "react-redux";
import { vi } from "vitest";
import App from "./App.jsx";

vi.mock("./pages/dashboard/DashboardPage.jsx", () => ({
  default: () => <div>Dashboard Mock</div>,
}));

vi.mock("./pages/admin/AdminPage.jsx", () => ({
  default: () => <div>Admin Mock</div>,
}));

vi.mock("./layouts/MainLayout.jsx", () => ({
  default: () => <div>Main Layout Mock</div>,
}));

vi.mock("./pages/auth/LoginPage.jsx", () => ({
  default: () => <h1>Đăng nhập</h1>,
}));

vi.mock("./layouts/AuthLayout.jsx", () => ({
  default: () => <Outlet />,
}));

vi.mock("./services/apiClient.js", () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { user: { id: 1 } } })),
  },
}));

function createTestStore(isAuthenticated = false) {
  return {
    getState: () => ({
      auth: {
        user: isAuthenticated ? { id: 1, role: "teacher" } : null,
        token: isAuthenticated ? "token" : null,
        isAuthenticated,
        status: "idle",
        error: null,
      },
    }),
    subscribe: () => () => {},
    dispatch: () => {},
  };
}

describe("App routing Part B", () => {
  test("renders landing page at root path", () => {
    const store = createTestStore(false);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText(/Tạo bài giảng nhanh hơn/i)).toBeInTheDocument();
  });

  test("redirects unauthenticated /dashboard to login page", () => {
    const store = createTestStore(false);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <App />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText(/Đăng nhập/i)).toBeInTheDocument();
  });
});
