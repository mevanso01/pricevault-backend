import * as twilioClient from 'twilio';

class Twilio {
  client: any = null;

  constructor() {
    this.client = twilioClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  sendOTP(phone: String) {
    return new Promise((resolve, reject) => {
      const phoneNumber = phone.charAt(0) == '+' ? phone : `+${phone}`;
      this.client
        .verify
        .services(process.env.TWILIO_SERVICE_ID)
        .verifications
        .create({
          to: phoneNumber,
          channel: 'sms'
        })
        .then((data: any) => {
          resolve(data);
        })
        .catch((e: any) => {
          reject(e)
        });
    });
  }

  verifyOTP(phone: String, code: String) {
    return new Promise((resolve, reject) => {
      const phoneNumber = phone.charAt(0) == '+' ? phone : `+${phone}`;
      this.client
        .verify
        .services(process.env.TWILIO_SERVICE_ID)
        .verificationChecks
        .create({
          to: phoneNumber,
          code: code
        })
        .then((data: any) => {
          resolve(data);
        })
        .catch((e: any) => {
          reject(e)
        });
    });
  }

  generateOTP(digit: Number) {
    // Declare a string variable 
    const string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let OTP = '';
    // Find the length of string
    const len = string.length;
    for (let i = 0; i < digit; i++) {
      OTP += string[Math.floor(Math.random() * len)];
    }
    return OTP;
  }
}

export default Twilio;