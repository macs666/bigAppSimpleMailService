/* eslint-disable no-console */
const httpStatus = require("http-status");
const { CronJob } = require("cron");
const sgMail = require("@sendgrid/mail");
const ApiError = require("../utils/APIError");
const catchAsync = require("../utils/catchAsync");
const MailRequest = require("../models/mailRequest");

const getMailRequests = (_req, res) => {
  try {
    MailRequest.find({})
      .then((requests) => {
        return res.status(200).json(requests);
      })
      .catch((err) => {
        console.log(
          "GET /mail-requests -- ",
          "Something has failed!",
          `${err.message} -> ${err.stack}`
        );
        return res.status(500).json({ success: false, message: err.message });
      });
  } catch (err) {
    console.log(
      "GET /mail-requests -- ",
      "Something has failed!",
      `${err.message} -> ${err.stack}`
    );
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createMailRequest = catchAsync(async (req, res) => {
  const mailRequest = await MailRequest.create(req.body);
  res.status(httpStatus.CREATED).send(mailRequest);
});

const getMailRequest = catchAsync(async (req, res) => {
  const mailRequest = await MailRequest.findById(req.params.id);
  if (!mailRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, "MailRequest not found");
  }
  res.send(mailRequest);
});

const updateMailRequest = catchAsync(async (req, res) => {
  const mailRequest = await MailRequest.findById(req.params.id);
  if (!mailRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, "MailRequest not found");
  }
  Object.assign(mailRequest, req.body);
  await mailRequest.save();
  res.send(mailRequest);
});

const deleteMailRequest = catchAsync(async (req, res) => {
  const mailRequest = await MailRequest.findById(req.params.id);
  if (!mailRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, "MailRequest not found");
  }
  await mailRequest.remove();
  res
    .status(httpStatus.NO_CONTENT)
    .send({ status: "success", rows_deleted: 1 });
});

const sendMail = async function (to, subject, text) {
  return new Promise((resolve, reject) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to,
      from: process.env.FROM_MAIL,
      subject,
      text,
      html: `<strong>${text}</strong>`,
    };
    sgMail
      .send(msg)
      .then((resp) => {
        console.log("Email sent");
        resolve(resp);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const processMailRequest = async function () {
  let results = [];
  try {
    results = await MailRequest.find({ status: "waiting" });
  } catch (err) {
    Promise.reject(err);
  }
  const now = new Date();
  results.forEach(function (arrayItem) {
    const mailRequest = arrayItem;
    const promises = [];
    if (mailRequest.send_on <= now) {
      mailRequest.send_to.forEach(function (email) {
        promises.push(
          sendMail(email, "mail alert from big app company", mailRequest.body)
        );
      });
      Promise.all(promises)
        .then(() => {
          mailRequest.status = "sent";
          mailRequest.save();
          Promise.resolve();
        })
        .catch((err) => {
          console.log(
            "CRON mail-requests -- ",
            "Something has failed!",
            `${err.message} -> ${err.stack}`
          );
          Promise.reject(err);
        });
    }
  });
};

const runMailCronJob = new CronJob(
  "*/5 * * * * *",
  async function () {
    try {
      const now = new Date();
      console.log(`running cron job running at ${now.toLocaleString()}`);
      await processMailRequest();
    } catch (err) {
      console.log(
        "CRON mail-requests -- ",
        "Something has failed!",
        `${err.message} -> ${err.stack}`
      );
    }
  },
  null,
  true
);

module.exports = {
  createMailRequest,
  getMailRequests,
  getMailRequest,
  updateMailRequest,
  deleteMailRequest,
  runMailCronJob,
  processMailRequest,
};
