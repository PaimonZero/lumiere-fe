import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import LandingPage from "./LandingPage.jsx";

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

describe("LandingPage Part B", () => {
  test("shows login CTA when user is not authenticated", () => {
    const store = createTestStore(false);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </Provider>,
    );

    const cta = screen.getAllByRole("link", { name: /Bắt đầu miễn phí/i })[0];
    expect(cta).toHaveAttribute("href", "/login");
    expect(screen.getByText(/Tính năng nổi bật/i)).toBeInTheDocument();
  });

  test("shows dashboard CTA when user is authenticated", () => {
    const store = createTestStore(true);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </Provider>,
    );

    const cta = screen.getAllByRole("link", { name: /Vào Dashboard/i })[0];
    expect(cta).toHaveAttribute("href", "/dashboard");
  });
});
