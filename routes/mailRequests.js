const express = require("express");

const router = express.Router();
const mailController = require("../controllers/mailRequestController");

/* GET users listing. */
router.get("/", mailController.getMailRequests);
router.get("/:id", mailController.getMailRequest);
router.post("/", mailController.createMailRequest);
router.put("/:id", mailController.updateMailRequest);
router.delete("/:id", mailController.deleteMailRequest);

module.exports = router;
