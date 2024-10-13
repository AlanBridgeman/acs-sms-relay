import axios from 'axios';

/**
 * A class that provides an interface to the Listmonk API.
 */
export class API {
    /** The hostname of the Listmonk instance. */
    private host: string;
    /** The username to use when authenticating with Listmonk. */
    private username: string;
    /** The password to use when authenticating with Listmonk. */
    private password: string;

    /**
     * Create a new Listmonk API instance.
     */
    constructor() {
        if(typeof process.env.LISTMONK_HOST === 'undefined' || process.env.LISTMONK_HOST === null || process.env.LISTMONK_HOST === '') {
            throw new Error('LISTMONK_HOST is not defined');
        }
        this.host = process.env.LISTMONK_HOST;

        if(typeof process.env.LISTMONK_USERNAME === 'undefined' || process.env.LISTMONK_USERNAME === null || process.env.LISTMONK_USERNAME === '') {
            throw new Error('LISTMONK_USERNAME is not defined');
        }
        this.username = process.env.LISTMONK_USERNAME;

        if(typeof process.env.LISTMONK_PASSWORD === 'undefined' || process.env.LISTMONK_PASSWORD === null || process.env.LISTMONK_PASSWORD === '') {
            throw new Error('LISTMONK_PASSWORD is not defined');
        }
        this.password = process.env.LISTMONK_PASSWORD;
    }

    /**
     * Make an API call to Listmonk to get details about the template with the specified ID.
     * 
     * @param templateId The ID of the template to get the details of.
     * @returns A promise that resolves to the results of the API call.
     */
    async getTemplate(templateId: number): Promise<any> {
        const results = await axios.get(`${this.host}/api/templates/${templateId}`, { auth: { username: this.username, password: this.password } }).then(response => response.data)
        
        return results;
    }

    /**
     * Make an API call to Listmonk to get all campaigns
     * 
     * @returns A promise that contains the results of the API call.
     */
    async getCampaigns(): Promise<any> {
        const response = await axios.get(`${this.host}/api/campaigns`, { auth: { username: this.username, password: this.password } }).then(response => response.data);
        return response;
    }
}