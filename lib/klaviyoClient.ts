// src/lib/klaviyoClient.ts

export async function addToKlaviyoList(email: string, listId: string) {
  console.log(`📧 Attempting to add ${email} to Klaviyo List: ${listId}`);
  
  try {
    const response = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
        'Content-Type': 'application/vnd.api+json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: [{
                type: 'profile',
                attributes: { email: email }
              }]
            }
          },
          relationships: {
            list: {
              data: { type: 'list', id: listId }
            }
          }
        }
      })
    })
    
    const responseData = await response.json(); // Response body read karna zaroori hai
    
    if (!response.ok) {
      console.error('❌ Klaviyo API Error:', response.status, responseData);
    } else {
      console.log('✅ Klaviyo Success:', responseData);
    }
  } catch (error) {
    console.error('❌ Klaviyo Fetch Exception:', error);
  }
}