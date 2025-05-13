// Simple script to test the waitlist API endpoint
// For Node.js v18+ we can use the built-in fetch API
// const fetch = require('node-fetch');

async function testWaitlistAPI() {
  try {
    // Replace with your actual API endpoint URL
    // During development it would be http://localhost:3001/api/waitlist
    // In production it would be https://eleveadmin.netlify.app/api/waitlist
    const apiUrl = 'http://localhost:3001/api/waitlist';
    
    // Test data - replace with an email that isn't already in the system
    const testData = {
      email: 'test@example.com',
      source: 'website_test'
    };
    
    console.log('Sending test data to waitlist API:', testData);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('API Response:', result);
    
    if (response.ok) {
      console.log('✓ Test successful!');
    } else {
      console.log('✗ Test failed.');
    }
  } catch (error) {
    console.error('Error testing waitlist API:', error);
  }
}

testWaitlistAPI(); 