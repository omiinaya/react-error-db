const puppeteer = require('puppeteer');

async function testMarkdownEditor() {
    const browser = await puppeteer.launch({
        headless: false, // Set to true for headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            console.log('Browser console:', msg.text());
        });
        
        // Enable error logging
        page.on('pageerror', error => {
            console.log('Browser page error:', error.message);
        });
        
        // Enable request/response logging
        page.on('requestfailed', request => {
            console.log('Request failed:', request.url(), request.failure().errorText);
        });

        console.log('🚀 Navigating to error creation page...');
        await page.goto('http://localhost:3005/error/create', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        console.log('⏳ Waiting for page to load...');
        await page.waitForTimeout(3000);

        console.log('🔍 Running diagnostic checks...');

        // Check 1: Look for markdown editor elements
        const editorElements = await page.evaluate(() => {
            const results = {
                hasEditorWrapper: !!document.querySelector('.markdown-editor-wrapper'),
                hasMdEditor: !!document.querySelector('.rc-md-editor'),
                hasNavigation: !!document.querySelector('.rc-md-navigation'),
                hasTabs: document.querySelectorAll('[role="tab"]').length,
                hasTextarea: !!document.querySelector('textarea'),
                hasToolbarButtons: document.querySelectorAll('.rc-md-navigation .button-wrap').length
            };
            return results;
        });

        console.log('📊 Editor Elements Found:');
        console.log(JSON.stringify(editorElements, null, 2));

        // Check 2: Check for CSS styles
        const cssInfo = await page.evaluate(() => {
            const editor = document.querySelector('.rc-md-editor');
            const navigation = document.querySelector('.rc-md-navigation');
            
            return {
                editorStyles: editor ? {
                    display: window.getComputedStyle(editor).display,
                    visibility: window.getComputedStyle(editor).visibility,
                    opacity: window.getComputedStyle(editor).opacity,
                    height: window.getComputedStyle(editor).height
                } : null,
                navigationStyles: navigation ? {
                    display: window.getComputedStyle(navigation).display,
                    visibility: window.getComputedStyle(navigation).visibility,
                    opacity: window.getComputedStyle(navigation).opacity
                } : null
            };
        });

        console.log('🎨 CSS Information:');
        console.log(JSON.stringify(cssInfo, null, 2));

        // Check 3: Check for specific toolbar buttons
        const toolbarButtons = await page.evaluate(() => {
            const buttons = document.querySelectorAll('.rc-md-navigation .button-wrap');
            const buttonInfo = [];
            
            buttons.forEach((button, index) => {
                const rect = button.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(button);
                
                buttonInfo.push({
                    index: index,
                    dataType: button.getAttribute('data-type') || 'unknown',
                    visible: rect.width > 0 && rect.height > 0,
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    width: rect.width,
                    height: rect.height
                });
            });
            
            return buttonInfo;
        });

        console.log('🔧 Toolbar Buttons Details:');
        console.log(JSON.stringify(toolbarButtons, null, 2));

        // Check 4: Test basic functionality
        console.log('🧪 Testing basic functionality...');

        // Try to type in the editor
        try {
            await page.waitForSelector('textarea', { timeout: 5000 });
            await page.focus('textarea');
            await page.type('textarea', '**Bold text** and *italic text*', { delay: 100 });
            
            const textareaValue = await page.$eval('textarea', el => el.value);
            console.log('✅ Textarea input test passed. Value:', textareaValue);
        } catch (error) {
            console.log('❌ Textarea input test failed:', error.message);
        }

        // Check 5: Test tab switching
        try {
            const tabs = await page.$$('[role="tab"]');
            if (tabs.length >= 2) {
                await tabs[1].click(); // Click the second tab (likely Preview)
                await page.waitForTimeout(1000);
                
                const activeTab = await page.$eval('[role="tab"][aria-selected="true"]', el => el.textContent);
                console.log('✅ Tab switching test passed. Active tab:', activeTab);
            } else {
                console.log('⚠️  Not enough tabs found for switching test');
            }
        } catch (error) {
            console.log('❌ Tab switching test failed:', error.message);
        }

        // Check 6: Look for error messages
        const errorMessages = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('.error, .text-red-500, .text-red-600, [style*="color: red"]');
            return Array.from(errorElements).map(el => ({
                text: el.textContent.trim(),
                tagName: el.tagName,
                className: el.className
            }));
        });

        if (errorMessages.length > 0) {
            console.log('⚠️  Error messages found on page:');
            console.log(JSON.stringify(errorMessages, null, 2));
        } else {
            console.log('✅ No error messages found on page');
        }

        // Check 7: Check network requests
        const failedRequests = await page.evaluate(() => {
            // This is a simplified check - in a real scenario you'd track network requests
            const images = document.querySelectorAll('img');
            const failedImages = [];
            
            images.forEach(img => {
                if (!img.complete || img.naturalHeight === 0) {
                    failedImages.push({
                        src: img.src,
                        alt: img.alt
                    });
                }
            });
            
            return failedImages;
        });

        if (failedRequests.length > 0) {
            console.log('⚠️  Failed resource loads detected:');
            console.log(JSON.stringify(failedRequests, null, 2));
        }

        console.log('🏁 Diagnostic test completed!');
        
        // Take a screenshot for visual inspection
        await page.screenshot({ path: 'editor-diagnostic-screenshot.png', fullPage: true });
        console.log('📸 Screenshot saved as editor-diagnostic-screenshot.png');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testMarkdownEditor().catch(console.error);