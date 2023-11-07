/**
 * This is a Cypress test to test if the home page contains the learning resources.
 */

/**
 * List of zones deployed.
 */
const deployedZones = [
    {url: 'https://vetshub.uqcloud.net', sso: false},
    {url: 'https://agfshub.uqcloud.net', sso: true},
    {url: 'https://chemhub.uqcloud.net', sso: true},
    {url: 'https://chemenghub.uqcloud.net', sso: true},
]

describe('Home Page', () => {
    it('Should be able to display learning resource component', () => {
        // This was needed due to the CORS error for UQ SSO.
        cy.on('uncaught:exception', (err, runnable) => {
            // return false here to prevent Cypress from
            // failing the test
            return false;
          });

      const testZone = (zone) => {
        cy.visit(zone.url).then(() => {
          if (zone.sso) {
            //Allow Authentication during this time.
            cy.wait(30000)
          }
          // Check if the learning resource container exists along with the link.
          cy.get('.inner-container').should('exist');
          cy.get('.collection-roots > li:nth-child(1) > a:nth-child(1)').should('exist');

        });
      };
  
      // Iterate over each zone and test it
      cy.wrap(deployedZones).each((zone) => {
        testZone(zone);
      });
  
    })

})