// ===================================================================
// SHORTICAL BEARER TOKEN EXTRACTOR
// ===================================================================
// 
// INSTRUCTIONS:
// 1. Open https://shortical.com in your browser
// 2. Sign in with Google
// 3. Open DevTools Console (F12 → Console tab)
// 4. Paste this entire file and press Enter
// 5. Your token will be copied to clipboard!
// 6. Paste it into .env as: VITE_BEARER_TOKEN=<paste_here>
//
// ===================================================================

(function() {
  console.clear();
  console.log('🔍 Searching for Shortical bearer token...\n');
  
  try {
    // Find Firebase auth key in localStorage
    const firebaseKey = Object.keys(localStorage).find(k => 
      k.startsWith('firebase:authUser:AIzaSyAJr-rEWWRiO4_GHPzqnbtuDWDuPljntUc')
    );
    
    if (!firebaseKey) {
      console.error('❌ ERROR: Not signed in to Shortical');
      console.log('\n📋 To fix:');
      console.log('   1. Make sure you\'re on https://shortical.com');
      console.log('   2. Click "Sign In" and authenticate with Google');
      console.log('   3. Run this script again\n');
      return;
    }
    
    // Parse auth data
    const authData = JSON.parse(localStorage.getItem(firebaseKey));
    
    if (!authData || !authData.stsTokenManager) {
      console.error('❌ ERROR: Auth data format unexpected');
      console.log('Auth data:', authData);
      return;
    }
    
    const token = authData.stsTokenManager.accessToken;
    const expirationTime = authData.stsTokenManager.expirationTime;
    const email = authData.email || 'unknown';
    
    if (!token) {
      console.error('❌ ERROR: No access token found');
      return;
    }
    
    // Calculate expiration
    const expiresIn = Math.floor((expirationTime - Date.now()) / 1000 / 60);
    const expiryDate = new Date(expirationTime);
    
    console.log('✅ SUCCESS: Bearer token found!\n');
    console.log('📧 Account:', email);
    console.log('⏱️  Expires:', expiryDate.toLocaleString());
    console.log('⏳ Time left:', expiresIn, 'minutes\n');
    
    console.log('🔑 Your Bearer Token:');
    console.log('━'.repeat(80));
    console.log(token);
    console.log('━'.repeat(80));
    console.log('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(token).then(() => {
      console.log('📋 ✅ TOKEN COPIED TO CLIPBOARD!\n');
      console.log('📝 Next steps:');
      console.log('   1. Open your .env file');
      console.log('   2. Find the line: VITE_BEARER_TOKEN=');
      console.log('   3. Paste the token after the = sign');
      console.log('   4. Save the file');
      console.log('   5. Restart your dev server (npm run dev)\n');
      console.log('⚠️  Token expires in ' + expiresIn + ' minutes. Save it now!\n');
    }).catch(err => {
      console.error('❌ Could not copy to clipboard:', err);
      console.log('💡 Manually copy the token above (between the lines)\n');
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\n🐛 Debug info:');
    console.log('   Location:', window.location.href);
    console.log('   localStorage keys:', Object.keys(localStorage));
  }
})();
