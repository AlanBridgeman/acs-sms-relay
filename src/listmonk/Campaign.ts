/**
 * A Campaign type as found in a [Listmonk Messenger](https://listmonk.app/docs/messengers/) request.
 * 
 * @see sample.json
 */
export type Campaign = {
    uuid: string,
    name: string,
    tags?: string[]
};