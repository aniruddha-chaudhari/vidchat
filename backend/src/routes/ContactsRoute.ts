import { Router } from "express";
import { createContact, getContacts } from "../controller/contactsController";
import protectRoute from "../middleware/ProtectRoute";

const router = Router();

router.get('/getcontacts',protectRoute, getContacts);
router.post('/createcontact',protectRoute, createContact);

export default router;