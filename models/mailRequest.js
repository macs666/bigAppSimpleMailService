const mongoose = require("mongoose");

const mailRequestSchema = mongoose.Schema(
  {
    send_to: {
      type: [String],
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "waiting", "failed", "cancelled"],
      default: "waiting",
    },
    send_on: {
      type: Date,
      required: true,
    },
    re_sent: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Change status to 'sent' when mail request is processed successfully
 * @returns {Promise<boolean>}
 */
mailRequestSchema.methods.mailSentSuccessful = () => {
  this.status = "sent";
};

/**
 * @typedef MailRequest
 */
const MailRequest = mongoose.model("MailRequestSchema", mailRequestSchema);

module.exports = MailRequest;
