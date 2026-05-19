const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const dir = path.join('e:', 'staycoolbooking1', 'src', 'app', 'api');
const files = walkDir(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // Replace error.message in NextResponse.json
  content = content.replace(/error:\s*error\.message\s*\|\|\s*'[^']*'/g, "error: 'An unexpected error occurred.'");
  content = content.replace(/error:\s*error\.message/g, "error: 'An unexpected error occurred.'");
  
  // Replace details: error.message
  content = content.replace(/details:\s*error\.message/g, "details: 'An unexpected error occurred.'");

  // Replace `Webhook Error: ${error.message}` with generic one but keep the status code if we need to
  // Wait, Webhook errors might need to be specific to Stripe. Stripe needs specific errors sometimes? Let's be careful.
  // The prompt says "never expose user data or logic". Stripe webhook error message might contain user data.
  content = content.replace(/error:\s*\`Webhook Error: \$\{error\.message\}\`/g, "error: 'Webhook Error: An unexpected error occurred.'");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
