#!/usr/bin/env node

/**
 * CreedaVA Deep Code Audit
 * Performs semantic analysis to find common mistakes and anti-patterns
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const issues = [];
const warnings = [];

// Color output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

function error(msg, file, line) {
  issues.push({ type: 'error', msg, file, line });
}

function warning(msg, file, line) {
  warnings.push({ type: 'warning', msg, file, line });
}

function findFiles(dir, extensions, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        findFiles(filePath, extensions, results);
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  }
  
  return results;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = path.relative(WORKSPACE_ROOT, filePath);
  
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // Check 1: Early returns that might block functionality
    if (line.includes('return') && line.includes('startsWith')) {
      if (line.includes("'/admin'") || line.includes('"/admin"')) {
        warning(`Potential blocking filter for admin pages`, relPath, lineNum);
      }
    }
    
    // Check 2: Hardcoded localhost URLs
    if (line.match(/http:\/\/localhost:\d+/) && !line.includes('//')) {
      if (!relPath.includes('test') && !relPath.includes('.md')) {
        error(`Hardcoded localhost URL`, relPath, lineNum);
      }
    }
    
    // Check 3: Missing error handling in async functions
    if (line.includes('async') && line.includes('(')) {
      const nextLines = lines.slice(idx, idx + 10).join('\n');
      if (!nextLines.includes('try') && !nextLines.includes('catch')) {
        warning(`Async function without try-catch`, relPath, lineNum);
      }
    }
    
    // Check 4: console.log in production code
    if (line.includes('console.log') && !relPath.includes('test')) {
      if (!relPath.includes('logger') && !line.includes('//')) {
        warning(`console.log in production code`, relPath, lineNum);
      }
    }
    
    // Check 5: Fetch without error handling
    if (line.includes('fetch(') && !line.includes('//')) {
      const nextLines = lines.slice(idx, idx + 5).join('\n');
      if (!nextLines.includes('catch') && !nextLines.includes('.catch')) {
        warning(`fetch() without error handling`, relPath, lineNum);
      }
    }
    
    // Check 6: Missing CORS headers in API endpoints
    if (filePath.includes('api/') && line.includes('return {')) {
      const nextLines = lines.slice(idx, idx + 5).join('\n');
      if (!nextLines.includes('headers') && !nextLines.includes('corsHeaders')) {
        warning(`API response might be missing CORS headers`, relPath, lineNum);
      }
    }
    
    // Check 7: Cosmos DB queries without partition key
    if (line.includes('container.item(') && !line.includes('//')) {
      // Check if it has two parameters
      const match = line.match(/container\.item\(([^)]+)\)/);
      if (match && !match[1].includes(',')) {
        error(`Cosmos DB item() call missing partition key`, relPath, lineNum);
      }
    }
    
    // Check 8: Missing type field in Cosmos writes
    if (line.includes('container.items.create(') || line.includes('container.items.upsert(')) {
      const nextLines = lines.slice(Math.max(0, idx - 5), idx + 10).join('\n');
      if (!nextLines.includes('type:') && !nextLines.includes('"type"')) {
        warning(`Cosmos DB write might be missing 'type' field for partition key`, relPath, lineNum);
      }
    }
    
    // Check 9: Environment variables used directly without fallback
    if (line.match(/process\.env\.\w+/) && !line.includes('||')) {
      if (!line.includes('//') && !relPath.includes('config')) {
        warning(`Environment variable without fallback`, relPath, lineNum);
      }
    }
    
    // Check 10: Missing SEO component in page components
    if (filePath.includes('src/pages/') && filePath.endsWith('.tsx')) {
      if (!content.includes('<SEO') && !content.includes('import.*SEO')) {
        warning(`Page component missing <SEO> component`, relPath, 1);
      }
    }
    
    // Check 11: Admin API naming patterns
    if (filePath.includes('adminApi') && line.includes("app.http('")) {
      const match = line.match(/app\.http\('([^']+)'/);
      if (match) {
        const endpoint = match[1];
        // Check if follows naming convention
        if (!endpoint.match(/^(get|create|update|delete)[A-Z]/)) {
          warning(`Admin endpoint doesn't follow naming convention: ${endpoint}`, relPath, lineNum);
        }
      }
    }
    
    // Check 12: Missing Authorization header checks in protected endpoints
    if (filePath.includes('api/admin') || (filePath.includes('api/') && content.includes('validateBearer'))) {
      if (!content.includes('Authorization') && !content.includes('validateBearer')) {
        error(`Protected endpoint missing authorization check`, relPath, 1);
      }
    }
    
    // Check 13: Improper GA4 event names
    if (line.includes('gtag(') && line.includes("'event'")) {
      const match = line.match(/gtag\('event',\s*'([^']+)'/);
      if (match) {
        const eventName = match[1];
        // GA4 recommends snake_case
        if (eventName.includes('-') || /[A-Z]/.test(eventName)) {
          warning(`GA4 event should use snake_case: ${eventName}`, relPath, lineNum);
        }
      }
    }
  });
}

// Run analysis
console.log('╔═══════════════════════════════════════════════════════════════════════╗');
console.log('║              CreedaVA Deep Code Audit                                 ║');
console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

console.log('Analyzing TypeScript/JavaScript files...');
const jsFiles = findFiles(path.join(WORKSPACE_ROOT, 'src'), ['.ts', '.tsx', '.js', '.jsx']);
const apiFiles = findFiles(path.join(WORKSPACE_ROOT, 'api'), ['.js']);

const allFiles = [...jsFiles, ...apiFiles];
console.log(`Found ${allFiles.length} files to analyze\n`);

allFiles.forEach(analyzeFile);

// Print results
if (issues.length > 0) {
  console.log(`${colors.red}━━━ ERRORS (${issues.length}) ━━━${colors.reset}\n`);
  issues.forEach(({ msg, file, line }) => {
    console.log(`${colors.red}✗${colors.reset} ${msg}`);
    console.log(`  ${file}:${line}\n`);
  });
}

if (warnings.length > 0) {
  console.log(`${colors.yellow}━━━ WARNINGS (${warnings.length}) ━━━${colors.reset}\n`);
  warnings.forEach(({ msg, file, line }) => {
    console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
    console.log(`  ${file}:${line}\n`);
  });
}

// Summary
console.log('╔═══════════════════════════════════════════════════════════════════════╗');
console.log('║                          Analysis Summary                             ║');
console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');
console.log(`${colors.green}Files analyzed:${colors.reset} ${allFiles.length}`);
console.log(`${colors.red}Errors:${colors.reset}         ${issues.length}`);
console.log(`${colors.yellow}Warnings:${colors.reset}       ${warnings.length}\n`);

if (issues.length === 0 && warnings.length === 0) {
  console.log(`${colors.green}✨ All checks passed!${colors.reset}\n`);
  process.exit(0);
} else if (issues.length > 0) {
  console.log(`${colors.red}Please fix errors before deploying.${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`${colors.yellow}Review warnings recommended.${colors.reset}\n`);
  process.exit(0);
}
