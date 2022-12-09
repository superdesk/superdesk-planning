import {defineConfig} from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: "http://localhost:9000",
        video: false,
        viewportWidth: 1920,
        viewportHeight: 1080,
        retries: {
            "runMode": 2,
            "openMode": 0
        },
        setupNodeEvents(on, config) {
            require('cypress-terminal-report/src/installLogsPrinter')(on);
        }
    }
});
