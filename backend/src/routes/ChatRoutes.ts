import { Router } from "express";
import { getContacts,createContact } from "../controller/contactsController";
import protectRoute from "../middleware/ProtectRoute";

const router = Router();

router.get('/all', protectRoute, getContacts);
router.post('/create', protectRoute, createContact);

export default router;