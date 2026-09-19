const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, '../src/styles/components.css');
let content = fs.readFileSync(cssPath, 'utf8');

const lines = content.split('\n');
const cleanLines = lines.slice(0, 1211);
const newCss = cleanLines.join('\n') + `

/* Export Buttons */
.btn-export {
  background: rgba(224, 231, 255, 0.65) !important;
  color: #4338ca !important;
  border: 1px solid rgba(99, 102, 241, 0.15) !important;
  transition: all 0.2s ease !important;
  backdrop-filter: blur(8px) !important;
}

.btn-export:hover {
  background: rgba(199, 210, 254, 0.85) !important;
  border-color: rgba(99, 102, 241, 0.3) !important;
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.15) !important;
}

.btn-export:active {
  background: #4338ca !important;
  color: #ffffff !important;
  border-color: #4338ca !important;
  box-shadow: 0 3px 10px rgba(67, 56, 202, 0.35) !important;
}
`;

fs.writeFileSync(cssPath, newCss, 'utf8');
console.log('Fixed CSS');
