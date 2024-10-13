/**
 * A Subscriber type as found in a [Listmonk Messenger](https://listmonk.app/docs/messengers/) request.
 * 
 * @see sample.json
 */
export type Subscriber = {
    uuid: string,
    email: string,
    name: string,
    attribs: {
        phone?: string,
        [key: string]: any
    },
    status: "enabled"
};