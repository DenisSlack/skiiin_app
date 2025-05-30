// Простой тест для проверки поиска ингредиентов
const fetch = require('node-fetch');

async function testIngredientSearch() {
  try {
    console.log('Testing ingredient search...');
    
    const response = await fetch('http://localhost:5000/api/find-ingredients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dXNlcl8wMDE6MTc0ODYxMzUxNTE2OQ=='
      },
      body: JSON.stringify({
        productName: 'L\'Oreal Paris Revitalift'
      })
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Found ingredients:', data.ingredients);
    } else {
      const error = await response.text();
      console.log('Error response:', error);
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testIngredientSearch();