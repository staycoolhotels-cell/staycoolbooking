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

const dir = path.join('e:', 'staycoolbooking1', 'src');
const files = walkDir(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // Replace toast.error(`... ${error.message}`) or toast.error('... ' + error.message)
  content = content.replace(/toast\.error\([^)]*error\.message[^)]*\)/g, "toast.error('An unexpected error occurred. Please try again later.')");
  
  // Replace alert(`... ${error.message}...`) or alert(... + error.message)
  content = content.replace(/alert\([^)]*error\.message[^)]*\)/g, "alert('An unexpected error occurred. Please try again later.')");
  
  // Replace setError(error.message || ...)
  content = content.replace(/setError\(error\.message[^)]*\)/g, "setError('An unexpected error occurred.')");

  // Replace showToast(`... ${error.message}`)
  content = content.replace(/showToast\([^)]*error\.message[^)]*\)/g, "showToast('An unexpected error occurred. Please try again later.', 'error')");
  
  // Also we saw `message: error.message` in some object mappings. Let's fix that.
  content = content.replace(/message:\s*error\.message/g, "message: 'An unexpected error occurred.'");
  
  // Replace error.message in setErrorMessage
  content = content.replace(/setErrorMessage\(error\.message[^)]*\)/g, "setErrorMessage('An unexpected error occurred.')");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
