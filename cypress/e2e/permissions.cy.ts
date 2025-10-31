describe("route protection via middleware + NextAuth", () => {
  it("unauthenticated → redirect to /login on protected route", () => {
    cy.request({
      url: "/validate",
      followRedirect: false,
      failOnStatusCode: false,
    }).then((r) => {
      expect([302, 307]).to.include(r.status);
      const loc = r.redirectedToUrl ?? r.headers.location;
      expect(loc).to.include("/login");
    });
  });

  it("TA cannot view /docs (403)", () => {
    cy.loginAs("testta");
    cy.request({ url: "/docs", failOnStatusCode: false })
      .its("status")
      .should("eq", 403);
  });

  it("Coordinator can view /docs (200)", () => {
    cy.loginAs("testcoordinator");
    cy.request("/docs").its("status").should("eq", 200);
    cy.visit("/docs");
    cy.contains("Documentation").should("exist");
  });

  it("nav only shows allowed links for TA", () => {
    cy.loginAs("testta");
    cy.visit("/");
    cy.contains("Home").should("exist");
    cy.contains("Preferences Form").should("exist");
    cy.contains("Validate").should("not.exist");
    cy.contains("Docs").should("not.exist");
  });

  it("nested route (/docs/foo) enforced", () => {
    cy.loginAs("testta");
    cy.request({ url: "/docs/foo", failOnStatusCode: false })
      .its("status")
      .should("eq", 403);
  });
});
