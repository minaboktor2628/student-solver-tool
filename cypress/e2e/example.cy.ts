describe("Dummy Cypress Test", () => {
  it("Visits example.com and checks the title", () => {
    cy.visit("/");

    cy.title().should("include", "STS");
  });
});
