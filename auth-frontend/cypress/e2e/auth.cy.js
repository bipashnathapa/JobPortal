describe("Auth and Register UI", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("loads the login page", () => {
    cy.visit("/login");
    cy.contains("Login").should("be.visible");
    cy.get('input[name="username"]').should("be.visible");
    cy.get('input[name="password"]').should("be.visible");
  });

  it("shows register success message inside student card", () => {
    cy.intercept("POST", "**/api/register/", {
      statusCode: 200,
      body: { message: "Registered. Please verify your email." },
    }).as("registerOk");

    cy.visit("/");
    cy.get(".student-card input[name='fullName']").type("Test Student");
    cy.get(".student-card input[name='username']").type("student_cy");
    cy.get(".student-card input[name='email']").type("student_cy@example.com");
    cy.get(".student-card input[name='university']").type("TU");
    cy.get(".student-card input[name='password']").type("password123");
    cy.contains(".student-card button", "Register").click();

    cy.wait("@registerOk");
    cy.contains(".student-card .form-message.success", "Registered. Please verify your email.").should("be.visible");
  });

  it("shows register error message inside employer card", () => {
    cy.intercept("POST", "**/api/register/", {
      statusCode: 400,
      body: { error: "Email already exists" },
    }).as("registerErr");

    cy.visit("/");
    cy.get(".employer-card input[name='companyName']").type("Test Co");
    cy.get(".employer-card input[name='username']").type("employer_cy");
    cy.get(".employer-card input[name='email']").type("existing@example.com");
    cy.get(".employer-card input[name='password']").type("password123");
    cy.contains(".employer-card button", "Register").click();

    cy.wait("@registerErr");
    cy.contains(".employer-card .form-message.error", "Email already exists").should("be.visible");
  });

  it("redirects student to /home after successful login", () => {
    cy.intercept("POST", "**/api/login/", {
      statusCode: 200,
      body: { access: "mock_access_token", role: "student" },
    }).as("loginOk");

    cy.visit("/login");
    cy.get('input[name="username"]').type("student_cy");
    cy.get('input[name="password"]').type("password123");
    cy.contains("button", "Login").click();

    cy.wait("@loginOk");
    cy.contains("Login successful").should("be.visible");
    cy.url().should("include", "/home");
  });
});
