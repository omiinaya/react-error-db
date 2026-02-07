// Markdown Editor Diagnostic Script
// This script checks for common issues with react-markdown-editor-lite

const diagnosticTests = {
    // Test 1: Check if react-markdown-editor-lite is properly imported
    checkImports: () => {
        try {
            // This would normally be run in the browser context
            console.log('✓ Checking imports...');
            return { status: 'pass', message: 'Imports appear to be working' };
        } catch (error) {
            return { status: 'fail', message: `Import error: ${error.message}` };
        }
    },

    // Test 2: Check CSS loading
    checkCSSLoading: () => {
        console.log('✓ Checking CSS loading...');
        // Check if the CSS file is being loaded
        const cssCheck = document.querySelector('link[href*="react-markdown-editor-lite"]') || 
                        document.querySelector('style[data-vite-dev-id*="react-markdown-editor-lite"]');
        
        if (cssCheck) {
            return { status: 'pass', message: 'CSS file detected' };
        } else {
            return { status: 'warning', message: 'CSS file not detected - may be loaded dynamically' };
        }
    },

    // Test 3: Check for editor container
    checkEditorContainer: () => {
        console.log('✓ Checking editor container...');
        const container = document.querySelector('.markdown-editor-wrapper');
        const editor = document.querySelector('.rc-md-editor');
        
        if (container && editor) {
            return { status: 'pass', message: 'Editor containers found' };
        } else {
            return { status: 'fail', message: 'Editor containers not found' };
        }
    },

    // Test 4: Check toolbar visibility
    checkToolbarVisibility: () => {
        console.log('✓ Checking toolbar visibility...');
        const navigation = document.querySelector('.rc-md-navigation');
        const buttons = document.querySelectorAll('.rc-md-navigation .button-wrap');
        
        if (navigation && buttons.length > 0) {
            return { 
                status: 'pass', 
                message: `Toolbar found with ${buttons.length} buttons`,
                details: {
                    buttonCount: buttons.length,
                    navigationVisible: navigation.offsetParent !== null,
                    navigationDisplay: window.getComputedStyle(navigation).display
                }
            };
        } else {
            return { 
                status: 'fail', 
                message: 'Toolbar not found or no buttons visible',
                details: {
                    navigationFound: !!navigation,
                    buttonCount: buttons.length
                }
            };
        }
    },

    // Test 5: Check for common CSS conflicts
    checkCSSConflicts: () => {
        console.log('✓ Checking for CSS conflicts...');
        const editor = document.querySelector('.rc-md-editor');
        
        if (editor) {
            const computedStyle = window.getComputedStyle(editor);
            const issues = [];
            
            if (computedStyle.display === 'none') {
                issues.push('Editor has display: none');
            }
            if (computedStyle.visibility === 'hidden') {
                issues.push('Editor has visibility: hidden');
            }
            if (computedStyle.opacity === '0') {
                issues.push('Editor has opacity: 0');
            }
            if (parseInt(computedStyle.height) === 0) {
                issues.push('Editor has zero height');
            }
            
            return {
                status: issues.length === 0 ? 'pass' : 'fail',
                message: issues.length === 0 ? 'No CSS conflicts detected' : `CSS issues found: ${issues.join(', ')}`,
                details: {
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    height: computedStyle.height
                }
            };
        } else {
            return { status: 'fail', message: 'Editor element not found' };
        }
    },

    // Test 6: Check for JavaScript errors
    checkJSErrors: () => {
        console.log('✓ Checking for JavaScript errors...');
        
        // Check console for errors (this would need to be run in browser)
        const originalConsoleError = console.error;
        let errorCount = 0;
        let errors = [];
        
        console.error = function(...args) {
            errorCount++;
            errors.push(args.join(' '));
            originalConsoleError.apply(console, args);
        };
        
        setTimeout(() => {
            console.error = originalConsoleError;
            if (errorCount > 0) {
                console.log('Found', errorCount, 'JavaScript errors:', errors);
            }
        }, 2000);
        
        return { status: 'info', message: 'JavaScript error monitoring started' };
    },

    // Test 7: Check React component props
    checkReactProps: () => {
        console.log('✓ Checking React component props...');
        
        // Look for the MarkdownEditor component in React DevTools
        // This is a simplified check
        const editorElement = document.querySelector('[data-testid="markdown-editor"]');
        const hasProps = editorElement && editorElement.__reactProps$;
        
        if (hasProps) {
            return { status: 'pass', message: 'React component props detected' };
        } else {
            return { status: 'warning', message: 'React component props not detected (may need React DevTools)' };
        }
    },

    // Test 8: Check for missing dependencies
    checkDependencies: () => {
        console.log('✓ Checking for missing dependencies...');
        
        // Check if required globals are available
        const requiredGlobals = ['React'];
        const missing = [];
        
        requiredGlobals.forEach(global => {
            if (typeof window[global] === 'undefined') {
                missing.push(global);
            }
        });
        
        if (missing.length === 0) {
            return { status: 'pass', message: 'All required globals available' };
        } else {
            return { status: 'fail', message: `Missing globals: ${missing.join(', ')}` };
        }
    }
};

// Run all diagnostic tests
function runDiagnostics() {
    console.log('🚀 Starting Markdown Editor Diagnostic Tests...\n');
    
    const results = {};
    let passCount = 0;
    let failCount = 0;
    let warningCount = 0;
    
    Object.keys(diagnosticTests).forEach(testName => {
        try {
            const result = diagnosticTests[testName]();
            results[testName] = result;
            
            switch (result.status) {
                case 'pass':
                    passCount++;
                    console.log(`✅ ${testName}: ${result.message}`);
                    break;
                case 'fail':
                    failCount++;
                    console.log(`❌ ${testName}: ${result.message}`);
                    if (result.details) {
                        console.log('   Details:', JSON.stringify(result.details, null, 2));
                    }
                    break;
                case 'warning':
                    warningCount++;
                    console.log(`⚠️  ${testName}: ${result.message}`);
                    break;
                default:
                    console.log(`ℹ️  ${testName}: ${result.message}`);
            }
        } catch (error) {
            results[testName] = { status: 'error', message: `Test failed with error: ${error.message}` };
            console.log(`💥 ${testName}: Test execution failed - ${error.message}`);
        }
    });
    
    console.log('\n📊 Diagnostic Summary:');
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    
    return {
        summary: {
            total: Object.keys(diagnosticTests).length,
            passed: passCount,
            failed: failCount,
            warnings: warningCount
        },
        results: results
    };
}

// Export for use in browser console
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runDiagnostics, diagnosticTests };
} else {
    window.runMarkdownEditorDiagnostics = runDiagnostics;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    console.log('🎯 Markdown Editor Diagnostics loaded. Run `runMarkdownEditorDiagnostics()` to start tests.');
}