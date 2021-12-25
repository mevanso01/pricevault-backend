import * as Handlebars from 'handlebars';
import * as Nodemailer from 'nodemailer';
import * as Email from 'email-templates';
import * as path from 'path';
import * as Consolidate from 'consolidate';

const MasterTemplate = require('../../email-templates/master.handlebars');

Handlebars.registerPartial('master', MasterTemplate);
Consolidate.requires.handlebars = Handlebars;

class Mailer {
  transport: any = null;

  constructor() {
    const mailTransportConfig = {
      "host": process.env.EMAIL_SMTP_HOST,
      "port": process.env.EMAIL_SMTP_PORT,
      "secure": true,
      "auth":{
         "user": process.env.EMAIL_SMTP_USER,
         "pass": process.env.EMAIL_SMTP_PASS
      },
      "logger": true,
      "debug": true
    };
    this.transport = Nodemailer.createTransport(mailTransportConfig);
  }

  getEmailInstance() {
    const emailOptions = {
      message: {
        from: process.env.EMAIL_FROM,
        jsonTransport: true,
      },
      views: {
        root: path.resolve('email-templates'),
        options: {
          extension: 'handlebars',
        },
      },
      htmlToText: true,
      transport: this.transport,
      send: true,
      juice: true,
      juiceResources: {
        preserveImportant: true,
        webResources: {
          relativeTo: path.resolve('email-templates'),
          images: 16, // 16KB max
        },
      },
    };
    if (this.transport.alwaysSend) {
      emailOptions.send = true;
    }
    return new Email(emailOptions);
  }

  sendTemplate(recipient: String, template: String, locals: any) {
    const email = this.getEmailInstance();
    const config = {
      message: {
        to: recipient,
        headers: {},
      },
      template,
      locals,
    };
    if (locals.replyTo) {
      config.message.headers['Reply-To'] = locals.replyTo;
    }
    if (locals.attachments) {
      config.message['attachments'] = locals.attachments;
    }
    return email.send(config);
  }

  async render(template: String, locals: any) {
    const email = this.getEmailInstance();
    return email.render(template, locals);
  }
}

export default Mailer;
export { Handlebars };