import React from 'react'
import CleaningMaintenanceLog from './CleaningMaintenanceLog'

describe('<CleaningMaintenanceLog />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<CleaningMaintenanceLog />)
  })
})