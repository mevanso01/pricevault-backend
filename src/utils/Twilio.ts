import * as twilioClient from 'twilio';

class Twilio {
  client: any = null;

  constructor() {
    this.client = twilioClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  sendOTP(phone: String, code: String) {
    return new Promise((resolve, reject) => {
      const twilioCaller = (process.env.TWILIO_PHONE_NUMBER.charAt(0) == '+')
        ? process.env.TWILIO_PHONE_NUMBER
        : `+${process.env.TWILIO_PHONE_NUMBER}`;
      const phoneNumber = phone.charAt(0) == '+' ? phone : `+${phone}`;

      this.client
        .messages
        .create({
          body: 'Your pricevault-2fa-service verification code is: ' + code,
          from: twilioCaller,
          to: phoneNumber
        })
        .then((data: any) => {
          resolve(data)
        })
        .catch((e: any) => {
          reject(e)
        });
    });
  }

  generateOTP(digit: Number) {
    // Declare a string variable 
    const string = '0123456789';
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