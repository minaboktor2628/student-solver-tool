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
  // 1) fetch csrf
  cy.request("/api/auth/csrf").then(({ body }) => {
    const csrfToken = body.csrfToken as string;

    // 2) post to credentials callback
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
      // in NextAuth v5, the callback returns a JSON with url or sets a cookie + redirects
      followRedirect: false,
    });
    //   .then((resp) => {
    //   // ensure cookie is set (jwt strategy in dev -> next-auth.session-token)
    //   const setCookie = resp.headers["set-cookie"] ?? [];
    //   const hasSession = setCookie.some(
    //     (c: string) =>
    //       c.includes("next-auth.session-token") ??
    //       c.includes("__Secure-next-auth.session-token"),
    //   );
    //   expect(hasSession, "session cookie set").to.be.true;
    // });
  });
});

/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
