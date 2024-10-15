import express, { Application, Request, Response } from 'express';

import { Campaign, APICredentials } from '@BridgemanAccessible/listmonk-node-client';

import { ACS } from '../ACS';

import { API as ListmonkAPI } from '../listmonk/API';
import { SendData } from '../listmonk/SendData';
import { IRouteController } from './IRouteController';

/**
 * Controller for sending campaigns from [Listmonk](https://listmonk.app) to recipients over SMS.
 */
export class ListmonkController implements IRouteController {
    /** The default credentials to use when authenticating with Listmonk. */
    private defaultCreds: APICredentials;

    /**
     * Create a new ListmonkController.
     */
    constructor() {
        if(typeof process.env.LISTMONK_HOST === 'undefined' || process.env.LISTMONK_HOST === null || process.env.LISTMONK_HOST === '') {
            throw new Error('LISTMONK_HOST is not defined');
        }
        
        if(typeof process.env.LISTMONK_USERNAME === 'undefined' || process.env.LISTMONK_USERNAME === null || process.env.LISTMONK_USERNAME === '') {
            throw new Error('LISTMONK_USERNAME is not defined');
        }
        
        if(typeof process.env.LISTMONK_PASSWORD === 'undefined' || process.env.LISTMONK_PASSWORD === null || process.env.LISTMONK_PASSWORD === '') {
            throw new Error('LISTMONK_PASSWORD is not defined');
        }

        this.defaultCreds = {
            host: process.env.LISTMONK_HOST,
            username: process.env.LISTMONK_USERNAME,
            password: process.env.LISTMONK_PASSWORD
        };
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
    private async checkPlainTextCampaign(campaignUUID: string, creds?: APICredentials): Promise<boolean> {
        // TODO: Verify the UUID provided matches a general UUID Regexp.

        // Query Listmonk for campaign data.
        const campaign = await Campaign.find((campaign: Campaign) => campaign.getUUID() === campaignUUID, creds ?? this.defaultCreds);

        // Check if we can find the campaign.
        if(typeof campaign === 'undefined') {
            console.error('Campaign not found.');
            return false;
        }
        
        // If the campaigns content type is defined and not plain text, we cannot send an SMS.
        if(typeof campaign.getContentType() !== 'undefined' && campaign.getContentType() !== 'plain') {
            console.error('Campaign content type is not plain text. Cannot send SMS.');
            return false;
        }

        const template = await campaign.getTemplate();
        // If the campaign uses a template, check if it is a plain text template.
        if(typeof template !== 'undefined') {
            if(decodeURIComponent(template.getBody()).startsWith('<!DOCTYPE html>') || decodeURIComponent(template.getBody()).startsWith('<html>')) {
                console.error('Campaign claims to be plain text. But uses an HTML template. Cannot send SMS.');
                return false;
            }
        }

        // If the campaign body is defined and starts with an HTML tag, we cannot send an SMS.
        if(typeof campaign.getCampaignBody() !== 'undefined' && decodeURIComponent(campaign.getCampaignBody()).startsWith('<!DOCTYPE html>') || decodeURIComponent(campaign.getCampaignBody()).startsWith('<html>')) {
            console.error('Campaign claims to be plain text. But the body contains HTML. Cannot send SMS.');
            return false;
        }

        return true;
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
    private async checkPlainText(sendData: SendData, creds?: APICredentials): Promise<boolean> {
        // Check if the content type is defined and not plain text.
        if(typeof sendData.content_type !== 'undefined' && sendData.content_type !== 'plain') {
            console.error('Send data content type is not plain text. Cannot send SMS.');
            return false;
        }

        // Check if the campaign is a plain text campaign.
        // This technically, isn't strictly necessary. But, it means a lot more helpful errors.
        const isPlainTextCampaign = await this.checkPlainTextCampaign(sendData.campaign.uuid, creds);
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

        const linkmost_host = req.query.linkmost_host;
        const linkmost_user = req.query.linkmost_user;
        const linkmost_pass = req.query.linkmost_pass;

        // TODO: Fallback to default credentials if not provided rather than erroring.
        if(typeof linkmost_host === 'undefined' || typeof linkmost_user === 'undefined' || typeof linkmost_pass === 'undefined') {
            res.status(400).send('Bad Request');
            return;
        }

        const creds: APICredentials = {
            host: linkmost_host as string,
            username: linkmost_user as string,
            password: linkmost_pass as string
        };
        
        // FOR DEBUGGING
        //console.log(sendData);

        // Check if the send data is a plain text message.
        const usesPlainText = await this.checkPlainText(sendData, creds);
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