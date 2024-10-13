import { SmsClient } from '@azure/communication-sms';

/**
 * A class to handle sending SMS messages using Azure Communication Services (ACS).
 */
export class ACS {
    /** The phone number to send SMS messages from (setup within ACS). */
    private fromNumber: string;
    /** The Azure Communication Services client. */
    private client: SmsClient;

    /**
     * Create a new Azure Communication Services object.
     */
    constructor() {
        // Verify the connection string is defined in the proper environment variable.
        if(typeof process.env.SMS_CONNECTION_STRING === 'undefined' || process.env.SMS_CONNECTION_STRING === null || process.env.SMS_CONNECTION_STRING === '') {
            throw new Error('SMS_CONNECTION_STRING is not defined');
        }

        // Get the connection string from the environment variable. Note, we verify it is defined above.
        const azCommConnStr = process.env.SMS_CONNECTION_STRING;

        // Create an Azure Communication Services
        this.client = new SmsClient(azCommConnStr);
        
        // Verify the from number is defined in the proper environment variable.
        if(typeof process.env.SMS_FROM_NUMBER === 'undefined' || process.env.SMS_FROM_NUMBER === null || process.env.SMS_FROM_NUMBER === '') {
            throw new Error('SMS_FROM_NUMBER is not defined');
        }

        // Get the from number from the environment variable. Note, we verify it is defined above.
        this.fromNumber = process.env.SMS_FROM_NUMBER;
    }

    /**
     * Send a message to the phone number over SMS.
     * 
     * @param phone The user's phone number.
     * @param message The message to send.
     * @returns Whether or not the SMS was sent successfully.
     */
    async sendSMS(phone: string, message: string): Promise<boolean> {
        const smsResults = await this.client.send({
            from: this.fromNumber,
            to: [phone],
            message: message
        });

        let success = true;

        await Promise.all(
            smsResults.map(
                async smsResult => {
                    // If there was an error, log it to the console.
                    if(smsResult.successful) {
                        console.log(`SMS sent: ${smsResult.messageId}`);
                    }
                    else {
                        console.error(`SMS error: ${smsResult.errorMessage}`);
                        success = false;
                    }
                }
            )
        );

        return success;
    }
}