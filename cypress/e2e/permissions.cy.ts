describe("route protection via middleware + NextAuth", () => {
  it("unauthenticated → redirect to /login on protected dashboard route", () => {
    cy.request({
      url: "/dashboard",
      followRedirect: false,
      failOnStatusCode: false,
    }).then((r) => {
      expect([302, 307]).to.include(r.status);
      const loc = r.redirectedToUrl ?? r.headers.location;
      expect(loc).to.include("/login");
    });
  });

  it("TA cannot view /dashboard", () => {
    cy.loginAs("testta");
    cy.visit("/dashboard", { failOnStatusCode: false });
    cy.url().should("include", "/error?error=AccessDenied");
    cy.contains("Code: AccessDenied").should("exist");
  });

  it("Coordinator can view /dashboard", () => {
    cy.loginAs("testcoordinator");
    cy.request("/dashboard").its("status").should("eq", 200);
    cy.visit("/dashboard");
    cy.contains("maybe some graphs").should("exist");
  });

  it("nav only shows allowed links for TA", () => {
    cy.loginAs("testta");
    cy.visit("/");
    cy.contains("Home").should("exist");
    cy.contains("Preferences").should("exist");
    cy.contains("Validate").should("not.exist");
    cy.contains("Docs").should("not.exist");
    cy.contains("About").should("exist");
    cy.contains("Dashboard").should("not.exist");
  });

  it("nested route (/dashboard/solver) enforced", () => {
    cy.loginAs("testta");
    cy.visit("/dashboard/solver", { failOnStatusCode: false });
    cy.url().should("include", "/error?error=AccessDenied");
  });
});
