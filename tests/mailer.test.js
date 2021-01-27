const moment = require("moment");
const mailController = require("../controllers/mailRequestController");
const MailRequest = require("../models/mailRequest");
const setupTestDB = require("../utils/setupTestDB");

describe("Mail request", () => {
  describe("send mail test", () => {
    setupTestDB();
    let mailRequest = MailRequest();
    beforeEach(async () => {
      const sendToDate = moment().subtract(1, "hours");
      mailRequest = await MailRequest.create({
        send_to: ["azharm@exalture.com", "macskuran@gmail.com"],
        body: "random mail content",
        status: "waiting",
        send_on: sendToDate.toLocaleString(),
        re_sent: false,
      });
    });

    test("should correctly sent a mail to the sender mails", async () => {
      await expect(
        await mailController.processMailRequest()
      ).resolves.toBeUndefined();
    });

    test("should not sent a mail before send to date to the sender mails", async () => {
      const sendToDate = moment().add(1, "hours");
      mailRequest.send_on = sendToDate.toLocaleString();
      mailRequest.save();
      await expect(await mailController.processMailRequest()).rejects.toThrow();
    });

    test("should not sent a mail of requests that are not in waiting", async () => {
      mailRequest.status = "sent";
      mailRequest.save();
      await expect(await mailController.processMailRequest()).rejects.toThrow();
    });
  });
});
