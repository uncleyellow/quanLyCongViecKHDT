import { cronService } from './src/services/cronService.js'

// Test script to verify cron job functionality
async function testCronJob() {
    try {
        console.log('Testing cron job functionality...')
        
        // Initialize the cron service
        cronService.init()
        
        console.log('Cron service initialized successfully')
        console.log('Service status:', cronService.isInitialized)
        
        // Test manual trigger
        console.log('\nTesting manual trigger...')
        await cronService.triggerManualDuplication()
        
        console.log('Test completed successfully!')
    } catch (error) {
        console.error('Test failed:', error)
    }
}

// Run the test
testCronJob()
