import { z } from "zod";
const Csrf = z.object({ csrfToken: z.string() });

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(
        passwordKey: "testpla" | "testta" | "testprof" | "testcoordinator",
      ): Chainable<void>;
    }
  }
}

Cypress.Commands.add("loginAs", (passwordKey) => {
  cy.request("/api/auth/csrf").then(({ body }) => {
    const { csrfToken } = Csrf.parse(body);

    cy.request({
      method: "POST",
      url: "/api/auth/callback/credentials",
      form: true,
      body: {
        csrfToken,
        password: passwordKey,
        json: "true",
        callbackUrl: "/", // where to land after login
      },
      followRedirect: false,
    });
  });
});
