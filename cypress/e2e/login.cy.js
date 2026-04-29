describe('StayCool Login Test', () => {
  it('User successfully logs in and redirects to the correct dashboard', () => {
    // 1. Visit the auth page (Login page)
    cy.visit('http://localhost:3000/auth');

    // 2. Enter login credentials
    // Note: Project lo unna inputs ki 'name' attributes 'email' and 'password' ga unnayi
    cy.get('input[name="email"]').type('test@gmail.com');
    cy.get('input[name="password"]').type('123456');

    // 3. Click the submit button
    cy.get('button[type="submit"]').click();

    // 4. Verify redirection
    // Project logic prakaram redirect dashboard ki kakunda role batti (admin-panel, host-dashboard, user-profile) veltundi.
    // Dashboard generic ga check cheyalante include('dashboard') leka content batti check cheyali.
    cy.url().should('match', /\/(admin-panel|host-dashboard|user-profile)/);
  });
});
