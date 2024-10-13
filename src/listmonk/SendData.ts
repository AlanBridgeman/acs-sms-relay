import { Subscriber } from './Subscriber';
import { Campaign } from './Campaign';

/**
 * A type to defined the format of [Listmonk Messenger](https://listmonk.app/docs/messengers/) requests.
 * 
 * @see sample.json
 */
export type SendData = {
    subject: string,
    body: string,
    content_type: "plain",
    recipients: Subscriber[],
    campaign: Campaign
}