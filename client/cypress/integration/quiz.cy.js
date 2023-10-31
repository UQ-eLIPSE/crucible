describe('Quiz', () => {
    it('Should be able to display quiz components', () => {
        cy.visit('http://localhost:5173/')
        // Visits the root
        cy.get('.collection-roots > li:nth-child(1) > a:nth-child(1)').click()
        cy.get('.overlay:first').click()
        cy.get('.overlay:first').click()
        cy.get('.overlay').eq(2).click()
        cy.get('.overlay:first').click()
        cy,get('.mutiple-choice-question').should('exist')
        cy.get('.question-option').should('exist')
        cy.get('.attempt').should('exist')
    })

})