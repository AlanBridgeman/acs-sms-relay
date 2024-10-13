import express, { Application, Request, Response } from 'express';

import { ACS } from '../ACS';

import { API as ListmonkAPI } from '../listmonk/API';
import { SendData } from '../listmonk/SendData';
import { IRouteController } from './IRouteController';

/**
 * Controller for sending campaigns from [Listmonk](https://listmonk.app) to recipients over SMS.
 */
export class ListmonkController implements IRouteController {
    /**
     * The Listmonk API instance (used to interact with Listmonk).
     */
    private api: ListmonkAPI;

    /**
     * Create a new ListmonkController.
     */
    constructor() {
        this.api = new ListmonkAPI();
    }

    /**
     * Check if the template with the given ID is a plain text template.
     * 
     * By "plain text template", we mean that the template is not an HTML template.
     * We check this by ensuring it does not start with an HTML or XML doctype declaration or tag.
     * 
     * @param templateId The ID of the template to check.
     * @returns A promise that resolves to true if the template is a plain text template. Otherwise, false.
     */
    private async checkPlainTextTemplate(templateId: number): Promise<boolean> {
        const plainTextTemplate = await this.api.getTemplate(templateId)
            .then(data => {
                if(decodeURIComponent(data.data.body).startsWith('<!DOCTYPE html>') || decodeURIComponent(data.data.body).startsWith('<html>')) {
                    console.error('Campaign claims to be plain text. But uses an HTML template. Cannot send SMS.');
                    return false;
                }

                return true;
            });
        
        return plainTextTemplate;
    }

    /**
     * Check if the campaign with the given UUID is a plain text campaign.
     * 
     * By "plain text campaign", we mean that the campaign is not an HTML campaign.
     * We check this by ensuring neither it's template OR body start with an HTML or XML doctype declaration or tag. And that it's content type is plain (if defined).
     * 
     * @param campaignUUID The UUID of the campaign to check.
     * @returns A promise that resolves to true if the campaign is a plain text campaign. Otherwise, false.
     */
    private async checkPlainTextCampaign(campaignUUID: string): Promise<boolean> {
        // TODO: Verify the UUID provided matches a general UUID Regexp.

        // Query Listmonk for campaign data.
        const plainTextCampaign = await this.api.getCampaigns()
            .then(data => { // Find the campaign with the given UUID.
                return data.data.results.find((campaign: { uuid: string, [key: string]: any }) => campaign.uuid == campaignUUID);
            })
            .then(campaign => {
                // If the campaigns content type is defined and not plain text, we cannot send an SMS.
                if(typeof campaign.content_type !== 'undefined' && campaign.content_type !== 'plain') {
                    console.error('Campaign content type is not plain text. Cannot send SMS.');
                    return false;
                }

                // If the campaign uses a template, check if it is a plain text template.
                if(typeof campaign.template_id !== 'undefined') {
                    const usesPlainTextTemplate = this.checkPlainTextTemplate(campaign.template_id);
                    if(!usesPlainTextTemplate) {
                        return false;
                    }
                }

                // If the campaign body is defined and starts with an HTML tag, we cannot send an SMS.
                if(typeof campaign.body !== 'undefined' && decodeURIComponent(campaign.body).startsWith('<!DOCTYPE html>') || decodeURIComponent(campaign.body).startsWith('<html>')) {
                    console.error('Campaign claims to be plain text. But the body contains HTML. Cannot send SMS.');
                    return false;
                }

                return true;
            });
        
        return plainTextCampaign;
    }

    /**
     * Check if the send data is a plain text message.
     * 
     * By "plain text message", we mean that the message content is not an HTML message.
     * We check this by ensuring it's content type is plain text (if defined) and that it's body does not start with an HTML or XML doctype declaration or tag.
     * This could be the case even though both the campaign and template are plain text IF you managed to use a templating value that evaluated to HTML content.
     * 
     * @param sendData The send data to check.
     * @returns A promise that resolves to true if the send data is a plain text message. Otherwise, false.
     */
    private async checkPlainText(sendData: SendData): Promise<boolean> {
        // Check if the content type is defined and not plain text.
        if(typeof sendData.content_type !== 'undefined' && sendData.content_type !== 'plain') {
            console.error('Send data content type is not plain text. Cannot send SMS.');
            return false;
        }

        // Check if the campaign is a plain text campaign.
        // This technically, isn't strictly necessary. But, it means a lot more helpful errors.
        const isPlainTextCampaign = await this.checkPlainTextCampaign(sendData.campaign.uuid);
        if(!isPlainTextCampaign) {
            return false;
        }

        // Check if the body is a plain text body.
        if(decodeURIComponent(sendData.body).startsWith('<!DOCTYPE html>') || decodeURIComponent(sendData.body).startsWith('<html>')) {
            console.error('Send data claims to be plain text. But the body contains HTML. Cannot send SMS.');
            return false;
        }

        return true;
    }

    /**
     * Send a campaign to the recipients over SMS.
     * 
     * @param req The Express request object.
     * @param res The Express response object.
     */
    private async campaignSend(req: Request, res: Response): Promise<void> {
        const sendData: SendData = req.body;
        
        // FOR DEBUGGING
        //console.log(sendData);

        // Check if the send data is a plain text message.
        const usesPlainText = await this.checkPlainText(sendData);
        if(!usesPlainText) {
            res.status(400).send('Bad Request');
            return;
        }

        // From ACS: "The field Message must be a string with a maximum length of 2048."
        if(sendData.body.length > 2048) {
            console.error('Send data body is too long. Cannot send SMS.');
            res.status(400).send('Bad Request');
            return;
        }
        
        const acs = new ACS();
        
        // Loop over each recipient and send an SMS if their phone number is set/defined.
        sendData.recipients.forEach(recipient => {
            if(typeof recipient.attribs.phone !== 'undefined') {
                acs.sendSMS(recipient.attribs.phone, sendData.body);
            }
        });

        res.status(200).send('Ok');
    }
    
    setup(app: Application): void {
        app.post('/listmonk/send', express.json(), this.campaignSend.bind(this));
    }
}